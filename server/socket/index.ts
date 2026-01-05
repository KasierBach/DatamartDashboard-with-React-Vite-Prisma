import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Track online users: { userId: number, name: string }
const onlineUsers = new Map<string, { userId: number; name: string }>();

export const initializeSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // User joins with their info
        socket.on('user:join', async (userData: { userId: number; name: string }) => {
            onlineUsers.set(socket.id, { userId: userData.userId, name: userData.name });

            // Join user's personal room for direct messages
            socket.join(`user:${userData.userId}`);

            // Broadcast online status to all
            io.emit('users:online', Array.from(onlineUsers.values()));

            console.log(`User ${userData.name} (${userData.userId}) joined`);
        });

        // Join a conversation room
        socket.on('conversation:join', (conversationId: number) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        // Leave a conversation room
        socket.on('conversation:leave', (conversationId: number) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Send a message
        socket.on('message:send', async (data: {
            conversationId: number;
            senderId: number;
            content: string;
            attachmentUrl?: string;
            attachmentType?: string;
        }) => {
            try {
                // Save message to database
                const message = await prisma.message.create({
                    data: {
                        conversation_id: data.conversationId,
                        sender_id: data.senderId,
                        content: data.content,
                        attachment_url: data.attachmentUrl,
                        attachment_type: data.attachmentType
                    },
                    include: {
                        statuses: true,
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true }
                        }
                    }
                });

                // Update conversation timestamp
                await prisma.conversation.update({
                    where: { id: data.conversationId },
                    data: { updated_at: new Date() }
                });

                // Unhide conversation for all members (Soft Delete logic)
                await prisma.conversationMember.updateMany({
                    where: {
                        conversation_id: data.conversationId,
                        is_hidden: true
                    },
                    data: { is_hidden: false }
                });

                // Emit to conversation room
                io.to(`conversation:${data.conversationId}`).emit('message:new', message);

                // Get conversation members to notify
                const members = await prisma.conversationMember.findMany({
                    where: { conversation_id: data.conversationId }
                });

                // Notify other members (for badge updates etc)
                for (const member of members) {
                    // Count unread messages for this specific member
                    const unreadCountForMember = await prisma.message.count({
                        where: {
                            conversation_id: data.conversationId,
                            sender_id: { not: member.user_id },
                            statuses: {
                                none: {
                                    user_id: member.user_id,
                                    seen_at: { not: null }
                                }
                            }
                        }
                    });

                    console.log(`Notifying user ${member.user_id}, unreadCount: ${unreadCountForMember}`);

                    // Update sidebar for everyone (including sender)
                    io.to(`user:${member.user_id}`).emit('conversation:updated', {
                        id: data.conversationId,
                        updated_at: message.created_at,
                        messages: [message],
                        unreadCount: unreadCountForMember // Fixed variable name consistency
                    });

                    if (member.user_id !== data.senderId) {
                        io.to(`user:${member.user_id}`).emit('message:notification', {
                            conversationId: data.conversationId,
                            message
                        });
                    }
                }

                console.log(`Message sent in conversation ${data.conversationId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message:error', { error: 'Failed to send message' });
            }
        });

        // Message delivered (when recipient receives it)
        socket.on('message:delivered', async (data: { messageId: number; userId: number }) => {
            try {
                await prisma.messageStatus.upsert({
                    where: {
                        message_id_user_id: {
                            message_id: data.messageId,
                            user_id: data.userId
                        }
                    },
                    create: {
                        message_id: data.messageId,
                        user_id: data.userId,
                        delivered_at: new Date()
                    },
                    update: {
                        delivered_at: new Date()
                    }
                });

                // Notify sender about delivery
                const message = await prisma.message.findUnique({
                    where: { id: data.messageId }
                });
                if (message) {
                    io.to(`user:${message.sender_id}`).emit('message:status', {
                        messageId: data.messageId,
                        status: 'delivered',
                        userId: data.userId
                    });
                }
            } catch (error) {
                console.error('Error updating delivered status:', error);
            }
        });

        // Message seen (when recipient reads it)
        socket.on('message:seen', async (data: { messageId: number; userId: number }) => {
            try {
                await prisma.messageStatus.upsert({
                    where: {
                        message_id_user_id: {
                            message_id: data.messageId,
                            user_id: data.userId
                        }
                    },
                    create: {
                        message_id: data.messageId,
                        user_id: data.userId,
                        delivered_at: new Date(),
                        seen_at: new Date()
                    },
                    update: {
                        seen_at: new Date()
                    }
                });

                // Notify sender about seen
                const message = await prisma.message.findUnique({
                    where: { id: data.messageId }
                });
                if (message) {
                    io.to(`user:${message.sender_id}`).emit('message:status', {
                        messageId: data.messageId,
                        status: 'seen',
                        userId: data.userId
                    });
                }
            } catch (error) {
                console.error('Error updating seen status:', error);
            }
        });

        // Edit message
        socket.on('message:edit', async (data: { messageId: number; userId: number; content: string; conversationId: number }) => {
            try {
                // Verify sender owns the message
                const message = await prisma.message.findUnique({ where: { id: data.messageId } });
                if (!message || message.sender_id !== data.userId) {
                    socket.emit('message:error', { error: 'Cannot edit this message' });
                    return;
                }

                const updated = await prisma.message.update({
                    where: { id: data.messageId },
                    data: {
                        content: data.content,
                        is_edited: true,
                        edited_at: new Date()
                    },
                    include: {
                        statuses: true,
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true }
                        }
                    }
                });

                // Broadcast to conversation
                io.to(`conversation:${data.conversationId}`).emit('message:edited', updated);
            } catch (error) {
                console.error('Error editing message:', error);
            }
        });

        // Delete message (only for self)
        socket.on('message:delete', async (data: { messageId: number; userId: number; conversationId: number }) => {
            try {
                await prisma.messageDelete.upsert({
                    where: {
                        message_id_user_id: {
                            message_id: data.messageId,
                            user_id: data.userId
                        }
                    },
                    create: {
                        message_id: data.messageId,
                        user_id: data.userId
                    },
                    update: {}
                });

                // Only notify the user who deleted
                socket.emit('message:deleted', { messageId: data.messageId, userId: data.userId });
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        });

        // Undo delete message (restore for self)
        socket.on('message:undelete', async (data: { messageId: number; userId: number; conversationId: number }) => {
            try {
                await prisma.messageDelete.delete({
                    where: {
                        message_id_user_id: {
                            message_id: data.messageId,
                            user_id: data.userId
                        }
                    }
                });

                // Fetch the restored message
                const message = await prisma.message.findUnique({
                    where: { id: data.messageId },
                    include: {
                        statuses: true,
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true }
                        }
                    }
                });

                console.log('Message undeleted, emitting:', { message, conversationId: data.conversationId });

                // Notify the user that the message is restored
                socket.emit('message:undeleted', {
                    message,
                    userId: data.userId,
                    conversationId: data.conversationId
                });
            } catch (error) {
                console.error('Error undeleting message:', error);
            }
        });

        // Recall message (for everyone)
        socket.on('message:recall', async (data: { messageId: number; userId: number; conversationId: number }) => {
            try {
                // Verify sender owns the message
                const message = await prisma.message.findUnique({ where: { id: data.messageId } });
                if (!message || message.sender_id !== data.userId) {
                    socket.emit('message:error', { error: 'Cannot recall this message' });
                    return;
                }

                // Delete file if exists
                if (message.attachment_url) {
                    try {
                        const filename = message.attachment_url.split('/').pop();
                        if (filename) {
                            const filePath = path.join(__dirname, '../uploads', filename);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(`Deleted file for recalled message: ${filePath}`);
                            }
                        }
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                }

                await prisma.message.update({
                    where: { id: data.messageId },
                    data: {
                        is_recalled: true,
                        content: '',
                        attachment_url: null, // Clear URL to reflect deletion
                        attachment_type: null
                    }
                });

                // Broadcast to everyone in conversation
                io.to(`conversation:${data.conversationId}`).emit('message:recalled', {
                    messageId: data.messageId,
                    conversationId: data.conversationId
                });
            } catch (error) {
                console.error('Error recalling message:', error);
            }
        });

        // Typing indicator
        socket.on('typing:start', (data: { conversationId: number; userId: number; userName: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
                userId: data.userId,
                userName: data.userName,
                isTyping: true
            });
        });

        socket.on('typing:stop', (data: { conversationId: number; userId: number }) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
                userId: data.userId,
                isTyping: false
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            const user = onlineUsers.get(socket.id);
            onlineUsers.delete(socket.id);

            // Broadcast updated online users
            io.emit('users:online', Array.from(onlineUsers.values()));

            if (user) {
                console.log(`User ${user.name} disconnected`);
            }
        });
    });
};
