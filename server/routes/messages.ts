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
                    some: { user_id: userId }
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
                    select: { id: true, username: true, name: true, role: true, email: true, phone: true }
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
                AND: [
                    { members: { some: { user_id: userId } } },
                    { members: { some: { user_id: targetUserId } } }
                ]
            },
            include: {
                members: true,
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 20
                }
            }
        });

        if (existing) {
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
                messages: true
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

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = parseInt(req.query.userId as string);

        const messages = await prisma.message.findMany({
            where: { conversation_id: conversationId },
            include: {
                statuses: true
            },
            orderBy: { created_at: 'asc' }
        });

        // Mark messages as seen
        if (userId) {
            const unreadMessages = messages.filter(
                m => m.sender_id !== userId &&
                    !m.statuses.some(s => s.user_id === userId && s.seen_at)
            );

            for (const msg of unreadMessages) {
                await prisma.messageStatus.upsert({
                    where: {
                        message_id_user_id: {
                            message_id: msg.id,
                            user_id: userId
                        }
                    },
                    create: {
                        message_id: msg.id,
                        user_id: userId,
                        delivered_at: new Date(),
                        seen_at: new Date()
                    },
                    update: {
                        seen_at: new Date()
                    }
                });
            }
        }

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
                statuses: true
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updated_at: new Date() }
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



// Delete a conversation (leave/hide for user)
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
            // Remove user from conversation members
            await prisma.conversationMember.delete({
                where: { id: member.id }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
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

export default router;
