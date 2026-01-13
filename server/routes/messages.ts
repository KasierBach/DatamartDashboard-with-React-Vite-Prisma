import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all conversations for a user
router.get('/conversations', async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.query.userId as string);
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                members: {
                    some: {
                        user_id: userId,
                        is_hidden: false
                    }
                }
            },
            include: {
                members: true,
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    include: {
                        statuses: true
                    }
                }
            },
            orderBy: { updated_at: 'desc' }
        });

        // Get user info for each conversation member
        const conversationsWithUsers = await Promise.all(
            conversations.map(async (conv) => {
                const memberUserIds = conv.members.map(m => m.user_id);
                const users = await prisma.user.findMany({
                    where: { id: { in: memberUserIds } },
                    select: { id: true, username: true, name: true, role: true, email: true, phone: true, avatar: true }
                });

                // Count unread messages
                const unreadCount = await prisma.message.count({
                    where: {
                        conversation_id: conv.id,
                        sender_id: { not: userId },
                        statuses: {
                            none: {
                                user_id: userId,
                                seen_at: { not: null }
                            }
                        }
                    }
                });

                return {
                    ...conv,
                    users,
                    unreadCount
                };
            })
        );

        res.json(conversationsWithUsers);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get or create a conversation between two users
router.post('/conversations', async (req: Request, res: Response) => {
    try {
        const { userId, targetUserId } = req.body;

        if (!userId || !targetUserId) {
            return res.status(400).json({ error: 'userId and targetUserId are required' });
        }

        // Check if conversation already exists
        const existing = await prisma.conversation.findFirst({
            where: {
                type: 'direct', // Ensure it's a direct message, not a group
                AND: [
                    { members: { some: { user_id: userId } } },
                    { members: { some: { user_id: targetUserId } } }
                ]
            },
            include: {
                members: true,
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 20,
                    include: {
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true }
                        }
                    }
                } as any
            }
        });

        if (existing as any) {
            // Unhide conversation if it exists but is hidden for current user
            const member = (existing as any).members.find((m: any) => m.user_id === userId);

            if (member?.is_hidden) {
                await prisma.conversationMember.update({
                    where: { id: member.id },
                    data: { is_hidden: false }
                });

                // Update local object to return correct state
                member.is_hidden = false;
            }

            const users = await prisma.user.findMany({
                where: { id: { in: [userId, targetUserId] } },
                select: { id: true, username: true, name: true }
            });
            return res.json({ ...existing, users });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                members: {
                    create: [
                        { user_id: userId },
                        { user_id: targetUserId }
                    ]
                }
            },
            include: {
                members: true,
                messages: {
                    include: {
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true }
                        }
                    }
                }
            }
        });

        const users = await prisma.user.findMany({
            where: { id: { in: [userId, targetUserId] } },
            select: { id: true, username: true, name: true }
        });

        res.json({ ...conversation, users });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Create a group conversation
router.post('/groups', async (req: Request, res: Response) => {
    try {
        const { userId, name, memberIds } = req.body;

        if (!userId || !name || !memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ error: 'userId, name and memberIds are required' });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                type: 'group',
                name,
                members: {
                    create: [
                        { user_id: userId, role: 'admin' },
                        ...memberIds.map((id: number) => ({ user_id: id, role: 'member' }))
                    ]
                }
            },
            include: {
                members: true,
                messages: {
                    include: {
                        sender: {
                            select: { id: true, username: true, name: true, avatar: true }
                        }
                    }
                }
            }
        });

        // Fetch users info
        const allUserIds = [userId, ...memberIds];
        const users = await prisma.user.findMany({
            where: { id: { in: allUserIds } },
            select: { id: true, username: true, name: true, role: true }
        });

        res.json({ ...conversation, users });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        const messages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId,
                deletedFor: {
                    none: {
                        user_id: userId
                    }
                }
            },
            include: {
                statuses: true,
                sender: {
                    select: { id: true, username: true, name: true, avatar: true }
                }
            } as any,
            orderBy: { created_at: 'asc' }
        });

        // REMOVED: Auto-mark as seen logic. 
        // Validation should be explicit via PUT /conversations/:id/read endpoint called by client.

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a message (used as fallback, Socket.IO is preferred)
router.post('/messages', async (req: Request, res: Response) => {
    try {
        const { conversationId, senderId, content } = req.body;

        const message = await prisma.message.create({
            data: {
                conversation_id: conversationId,
                sender_id: senderId,
                content
            },
            include: {
                statuses: true,
                sender: {
                    select: { id: true, username: true, name: true, avatar: true }
                }
            } as any
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updated_at: new Date() }
        });

        // Unhide conversation for all members (Soft Delete logic)
        await prisma.conversationMember.updateMany({
            where: {
                conversation_id: conversationId,
                is_hidden: true
            },
            data: { is_hidden: false }
        });

        res.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get users for starting a new conversation
router.get('/users/available', async (req: Request, res: Response) => {
    try {
        const currentUserId = parseInt(req.query.userId as string);

        const users = await prisma.user.findMany({
            where: currentUserId ? { id: { not: currentUserId } } : {},
            select: { id: true, username: true, name: true, role: true }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});



// Delete a conversation (Hard Delete / Leave)
router.delete('/conversations/:id', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if user is member
        const member = await prisma.conversationMember.findUnique({
            where: {
                conversation_id_user_id: {
                    conversation_id: conversationId,
                    user_id: userId
                }
            }
        });

        if (member) {
            // Hard delete: Remove user from conversation members
            await prisma.conversationMember.delete({
                where: { id: member.id }
            });

            // Check if any members left, if not, delete conversation
            const remainingMembers = await prisma.conversationMember.count({
                where: { conversation_id: conversationId }
            });

            if (remainingMembers === 0) {
                await prisma.conversation.delete({
                    where: { id: conversationId }
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// Hide a conversation (Soft Delete)
router.put('/conversations/:id/hide', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if user is member
        const member = await prisma.conversationMember.findUnique({
            where: {
                conversation_id_user_id: {
                    conversation_id: conversationId,
                    user_id: userId
                }
            }
        });

        if (member) {
            await prisma.conversationMember.update({
                where: { id: member.id },
                data: { is_hidden: true }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error hiding conversation:', error);
        res.status(500).json({ error: 'Failed to hide conversation' });
    }
});

// Clear chat history (Soft Delete all messages for user)
router.put('/conversations/:id/clear-history', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if user is member
        const member = await prisma.conversationMember.findUnique({
            where: {
                conversation_id_user_id: {
                    conversation_id: conversationId,
                    user_id: userId
                }
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Not a member of this conversation' });
        }

        // Find all messages in this conversation
        const messages = await prisma.message.findMany({
            where: { conversation_id: conversationId },
            select: { id: true }
        });

        if (messages.length > 0) {
            await prisma.messageDelete.createMany({
                data: messages.map(msg => ({
                    message_id: msg.id,
                    user_id: userId
                })),
                skipDuplicates: true
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// Mark conversation as read
router.put('/conversations/:id/read', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        console.log('MARKING AS READ:', { conversationId, userId });

        // Find all unread messages from others
        const unreadMessages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId,
                sender_id: { not: userId },
                statuses: {
                    none: {
                        user_id: userId,
                        seen_at: { not: null }
                    }
                }
            }
        });

        // Mark them as seen
        await Promise.all(unreadMessages.map(msg =>
            prisma.messageStatus.upsert({
                where: {
                    message_id_user_id: {
                        message_id: msg.id,
                        user_id: userId
                    }
                },
                create: {
                    message_id: msg.id,
                    user_id: userId,
                    seen_at: new Date(),
                    delivered_at: new Date()
                },
                update: {
                    seen_at: new Date()
                }
            })
        ));

        // NOTIFY VIA SOCKET
        const io = (req as any).io;
        if (io) {
            // Notify sender(s) that their messages were seen
            unreadMessages.forEach(msg => {
                io.to(`user:${msg.sender_id}`).emit('message:status', {
                    messageId: msg.id,
                    status: 'seen',
                    userId: userId
                });
            });

            // Update sidebar for current user to clear badge
            io.to(`user:${userId}`).emit('conversation:updated', {
                id: conversationId,
                unreadCount: 0
            });
        }

        res.json({ success: true, count: unreadMessages.length });
    } catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
});

// Mark conversation as unread
router.put('/conversations/:id/unread', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Find the last message from someone else
        const lastMessage = await prisma.message.findFirst({
            where: {
                conversation_id: conversationId,
                sender_id: { not: userId }
            },
            orderBy: { created_at: 'desc' }
        });

        if (lastMessage) {
            // Update status to unseen
            await prisma.messageStatus.upsert({
                where: {
                    message_id_user_id: {
                        message_id: lastMessage.id,
                        user_id: userId
                    }
                },
                create: {
                    message_id: lastMessage.id,
                    user_id: userId,
                    delivered_at: new Date(),
                    seen_at: null
                },
                update: {
                    seen_at: null
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking conversation as unread:', error);
        res.status(500).json({ error: 'Failed to mark conversation as unread' });
    }
});

// Update Group (Rename)
router.put('/groups/:id', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { userId, name } = req.body;

        if (!userId || !name) {
            return res.status(400).json({ error: 'userId and name are required' });
        }

        // Verify user is a member
        const member = await prisma.conversationMember.findUnique({
            where: {
                conversation_id_user_id: {
                    conversation_id: conversationId,
                    user_id: userId
                }
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        // Update name
        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                name,
                updated_at: new Date()
            },
            include: {
                members: true,
                messages: { take: 1, orderBy: { created_at: 'desc' } }
            }
        });

        // Emit update
        (req as any).io.to(`conversation:${conversationId}`).emit('conversation:updated', updated);

        res.json(updated);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// Add Members to Group
router.post('/groups/:id/members', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { userId, memberIds } = req.body; // memberIds: number[]

        if (!userId || !memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ error: 'userId and memberIds are required' });
        }

        // Verify requester is member
        const requester = await prisma.conversationMember.findUnique({
            where: {
                conversation_id_user_id: { conversation_id: conversationId, user_id: userId }
            }
        });

        if (!requester) {
            return res.status(403).json({ error: 'Not a member' });
        }

        // Add members (ignore if already exists)
        await Promise.all(memberIds.map(async (id: number) => {
            try {
                await prisma.conversationMember.create({
                    data: {
                        conversation_id: conversationId,
                        user_id: id,
                        role: 'member'
                    }
                });
            } catch (e) {
                // Ignore unique constraint violation
            }
        }));

        const updated = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                members: true,
                messages: { take: 1, orderBy: { created_at: 'desc' } }
            }
        });

        if (updated) {
            // Fetch user info for the updated conversation to return full data
            const memberUserIds = updated.members.map(m => m.user_id);
            const users = await prisma.user.findMany({
                where: { id: { in: memberUserIds } },
                select: { id: true, username: true, name: true, role: true }
            });
            const fullConversation = { ...updated, users };

            // Emit update to group
            (req as any).io.to(`conversation:${conversationId}`).emit('conversation:updated', fullConversation);

            // Notify NEW members separately (so they see the group appear)
            memberIds.forEach((id: number) => {
                (req as any).io.to(`user:${id}`).emit('conversation:new', fullConversation);
            });

            res.json(fullConversation);
        } else {
            res.status(404).json({ error: 'Conversation not found' });
        }
    } catch (error) {
        console.error('Error adding members:', error);
        res.status(500).json({ error: 'Failed to add members' });
    }
});

// Remove Member from Group
router.delete('/groups/:id/members/:targetUserId', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const targetUserId = parseInt(req.params.targetUserId);
        const userId = parseInt(req.query.userId as string); // Requester

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Verify requester is ADMIN
        const requester = await prisma.conversationMember.findUnique({
            where: {
                conversation_id_user_id: { conversation_id: conversationId, user_id: userId }
            }
        });

        if (!requester || requester.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can remove members' });
        }

        // Delete member
        await prisma.conversationMember.deleteMany({
            where: {
                conversation_id: conversationId,
                user_id: targetUserId
            }
        });

        const updated = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                members: true,
                messages: { take: 1, orderBy: { created_at: 'desc' } }
            }
        });

        if (updated) {
            const memberUserIds = updated.members.map(m => m.user_id);
            const users = await prisma.user.findMany({
                where: { id: { in: memberUserIds } },
                select: { id: true, username: true, name: true, role: true }
            });
            const fullConversation = { ...updated, users };

            // Emit update to remaining members
            (req as any).io.to(`conversation:${conversationId}`).emit('conversation:updated', fullConversation);

            // Notify REMOVED member (so it disappears/disables)
            (req as any).io.to(`user:${targetUserId}`).emit('conversation:removed', { id: conversationId });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Leave Group
router.post('/groups/:id/leave', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: 'userId required' });

        await prisma.conversationMember.deleteMany({
            where: { conversation_id: conversationId, user_id: userId }
        });

        // Notify group
        const updated = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: true }
        });

        if (updated && updated.members.length > 0) {
            (req as any).io.to(`conversation:${conversationId}`).emit('conversation:updated', updated);
        } else if (updated && updated.members.length === 0) {
            // Delete group if empty? Or keep it? Usually delete.
            await prisma.conversation.delete({ where: { id: conversationId } });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

// ==========================================
// ENHANCED CHAT FEATURES - NEW ROUTES
// ==========================================

// Search messages in a conversation
router.get('/conversations/:id/messages/search', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);
        const query = req.query.q as string;

        if (!query || query.trim().length === 0) {
            return res.json([]);
        }

        const messages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId,
                content: { contains: query, mode: 'insensitive' },
                is_recalled: false,
                deletedFor: { none: { user_id: userId } }
            },
            include: {
                sender: { select: { id: true, username: true, name: true, avatar: true } },
                reactions: true
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        res.json(messages);
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ error: 'Failed to search messages' });
    }
});

// Add reaction to a message
router.post('/messages/:id/reactions', async (req: Request, res: Response) => {
    try {
        const messageId = parseInt(req.params.id);
        const { userId, emoji } = req.body;

        if (!userId || !emoji) {
            return res.status(400).json({ error: 'userId and emoji are required' });
        }

        const reaction = await prisma.messageReaction.create({
            data: {
                message_id: messageId,
                user_id: userId,
                emoji
            }
        });

        // Get updated reactions for the message
        const reactions = await prisma.messageReaction.findMany({
            where: { message_id: messageId }
        });

        // Emit to conversation via socket
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (message) {
            (req as any).io.to(`conversation:${message.conversation_id}`).emit('reaction:updated', {
                messageId,
                reactions
            });
        }

        res.json({ reaction, reactions });
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Duplicate reaction, return existing
            const messageId = parseInt(req.params.id);
            const reactions = await prisma.messageReaction.findMany({
                where: { message_id: messageId }
            });
            return res.json({ reactions });
        }
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'Failed to add reaction' });
    }
});

// Remove reaction from a message
router.delete('/messages/:id/reactions/:emoji', async (req: Request, res: Response) => {
    try {
        const messageId = parseInt(req.params.id);
        const emoji = decodeURIComponent(req.params.emoji);
        const userId = parseInt(req.query.userId as string);

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        await prisma.messageReaction.deleteMany({
            where: {
                message_id: messageId,
                user_id: userId,
                emoji
            }
        });

        // Get updated reactions
        const reactions = await prisma.messageReaction.findMany({
            where: { message_id: messageId }
        });

        // Emit to conversation
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (message) {
            (req as any).io.to(`conversation:${message.conversation_id}`).emit('reaction:updated', {
                messageId,
                reactions
            });
        }

        res.json({ reactions });
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
});

// Get pinned messages for a conversation
router.get('/conversations/:id/pinned', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);

        const pinnedMessages = await prisma.pinnedMessage.findMany({
            where: { conversation_id: conversationId },
            include: {
                message: {
                    include: {
                        sender: { select: { id: true, username: true, name: true, avatar: true } }
                    }
                }
            },
            orderBy: { pinned_at: 'desc' }
        });

        res.json(pinnedMessages);
    } catch (error) {
        console.error('Error fetching pinned messages:', error);
        res.status(500).json({ error: 'Failed to fetch pinned messages' });
    }
});

// Pin a message
router.post('/messages/:id/pin', async (req: Request, res: Response) => {
    try {
        const messageId = parseInt(req.params.id);
        const { userId, conversationId } = req.body;

        if (!userId || !conversationId) {
            return res.status(400).json({ error: 'userId and conversationId are required' });
        }

        const pinned = await prisma.pinnedMessage.create({
            data: {
                conversation_id: conversationId,
                message_id: messageId,
                pinned_by: userId
            },
            include: {
                message: {
                    include: {
                        sender: { select: { id: true, username: true, name: true, avatar: true } }
                    }
                }
            }
        });

        // Emit to conversation
        (req as any).io.to(`conversation:${conversationId}`).emit('message:pinned', {
            messageId,
            pinnedBy: userId,
            conversationId,
            pinnedMessage: pinned
        });

        res.json(pinned);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Message already pinned' });
        }
        console.error('Error pinning message:', error);
        res.status(500).json({ error: 'Failed to pin message' });
    }
});

// Unpin a message
router.delete('/messages/:id/pin', async (req: Request, res: Response) => {
    try {
        const messageId = parseInt(req.params.id);
        const conversationId = parseInt(req.query.conversationId as string);
        const userId = parseInt(req.query.userId as string);

        if (!conversationId || !userId) {
            return res.status(400).json({ error: 'conversationId and userId are required' });
        }

        await prisma.pinnedMessage.deleteMany({
            where: {
                conversation_id: conversationId,
                message_id: messageId
            }
        });

        // Emit to conversation
        (req as any).io.to(`conversation:${conversationId}`).emit('message:unpinned', {
            messageId,
            conversationId
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error unpinning message:', error);
        res.status(500).json({ error: 'Failed to unpin message' });
    }
});

// Forward a message to other conversations
router.post('/messages/:id/forward', async (req: Request, res: Response) => {
    try {
        const messageId = parseInt(req.params.id);
        const { userId, targetConversationIds } = req.body;

        if (!userId || !targetConversationIds || !Array.isArray(targetConversationIds)) {
            return res.status(400).json({ error: 'userId and targetConversationIds are required' });
        }

        // Get original message
        const originalMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: { sender: { select: { id: true, username: true, name: true } } }
        });

        if (!originalMessage || originalMessage.is_recalled) {
            return res.status(404).json({ error: 'Message not found or was recalled' });
        }

        // Create forwarded messages
        const forwardedMessages = await Promise.all(
            targetConversationIds.map(async (convId: number) => {
                const newMessage = await prisma.message.create({
                    data: {
                        conversation_id: convId,
                        sender_id: userId,
                        content: originalMessage.content,
                        attachment_url: originalMessage.attachment_url,
                        attachment_type: originalMessage.attachment_type,
                        forwarded_from: messageId
                    },
                    include: {
                        sender: { select: { id: true, username: true, name: true, avatar: true } },
                        statuses: true,
                        reactions: true
                    }
                });

                // Update conversation timestamp
                await prisma.conversation.update({
                    where: { id: convId },
                    data: { updated_at: new Date() }
                });

                // Emit to each target conversation
                (req as any).io.to(`conversation:${convId}`).emit('message:new', newMessage);

                return newMessage;
            })
        );

        res.json({ success: true, forwardedMessages });
    } catch (error) {
        console.error('Error forwarding message:', error);
        res.status(500).json({ error: 'Failed to forward message' });
    }
});

export default router;
