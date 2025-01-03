const { sequelize, ForumComment, User, Image, ForumPost, Notification} = require("../../models");
const Sequelize = require('sequelize');
const sharp = require('sharp');
const { loggedInUsers } = require('../../shared');

const createForumComment = async (req, res) => {
    const userId = parseInt(req.params.userId);

    const transaction = await sequelize.transaction();

    try {
        const images = req.files;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const forumComment = await ForumComment.create({
            userId: userId,
            forumPostId: req.body.forumPostId,
            message: req.body.message,
            isInappropriate: false,
        });


        const failedImages = [];


        for (let index = 0; index < images.length; index++) {
            const image = images[index];

            try {
                const processedImageBuffer = await sharp(image.buffer)
                    .resize({ width: 800, height: 600 }) // You can set the dimensions accordingly
                    .webp()
                    .toBuffer();

                currentImage = await Image.create({ image: processedImageBuffer }, { transaction });
                await forumComment.addImage(currentImage, { transaction });

            } catch (imageError) {
                console.error('Error creating image:', imageError);
                failedImages.push({ index, error: 'Failed to create image' });
            }
        }

        if (failedImages.length > 0) {
            // If there were failed images, roll back the transaction
            await transaction.rollback();
            console.log('Rolled back transaction due to errors in creating images.');
            return res.status(500).json({ error: 'Error creating some images', failedImages });
        }

        await transaction.commit();
        console.log('Transaction committed successfully.');

        //Create Notification
        // console.log(req.body.forumPostId)
        const forumPost = await ForumPost.findByPk(parseInt(req.body.forumPostId));
        // console.log("forumPost ", forumPost)
        const forumPostUser = await forumPost.getUser();
        // console.log("forumPostUser ", forumPostUser)

        const content = `${user.userName.charAt(0).toUpperCase() + user.userName.slice(1)} has commented: "${req.body.message}" on forum post: "${forumPost.title}"`;

        const notificationBody = {
            "isRecent": true,
            "isPending": false,
            "isCompleted": false,
            "hasRead": false,
            "userNotificationId": userId,
            "userId" : forumPostUser.userId,
            "content" : content,
            "forumPostId" : forumPost.forumPostId,
            "forumCommentId" : forumComment.forumCommentId,
            "userNavigationScreen" : "forumComment"
        };

        await Notification.create(notificationBody);


        if (forumPostUser && loggedInUsers.has(forumPostUser.userId) && forumPostUser.userId !== userId){
            req.io.emit("userNotification", {"pushToken": forumPostUser.pushToken, "title": forumPost.title, "body": content});
            // console.log("Emitted userNewForumCommentNotification");
        }
        res.status(201).json({ forumComment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllForumComment = async (req, res) => {
    try {
        const { sort } = req.query;
        const increase = JSON.parse(req.query.increase);
        const forumPostId = parseInt(req.query.forumPostId);
        const userId = parseInt(req.params.userId);

        let orderCriteria = [['createdAt', 'DESC']];

        if (sort !== 'vote' && increase) {
            orderCriteria = [['updatedAt', 'ASC']];

        }

        if (sort === 'vote') {
            // Sorting by the difference between upvotes and downvotes
            if (!increase) {
                orderCriteria = [
                    [
                        Sequelize.literal('(SELECT COUNT(*) FROM `UserCommentUpvoted` AS `UserCommentUpvoted` WHERE `ForumComment`.`forumCommentId` = `UserCommentUpvoted`.`forumCommentId`) - (SELECT COUNT(*) FROM `UserCommentDownvoted` AS `UserCommentDownvoted` WHERE `ForumComment`.`forumCommentId` = `UserCommentDownvoted`.`forumCommentId`)'),
                        'DESC',
                    ],
                ];
            } else {
                orderCriteria = [
                    [
                        Sequelize.literal('(SELECT COUNT(*) FROM `UserCommentUpvoted` AS `UserCommentUpvoted` WHERE `ForumComment`.`forumCommentId` = `UserCommentUpvoted`.`forumCommentId`) - (SELECT COUNT(*) FROM `UserCommentDownvoted` AS `UserCommentDownvoted` WHERE `ForumComment`.`forumCommentId` = `UserCommentDownvoted`.`forumCommentId`)'),
                        'ASC',
                    ],
                ];
            }
        }

        const forumComments = await ForumComment.findAll({
            order: orderCriteria,
            where: {
                isInappropriate: {
                    [Sequelize.Op.not]: true,
                },
                forumPostId: forumPostId,
                forumCommentId: {
                    [Sequelize.Op.notIn]: Sequelize.literal(
                        `(SELECT forumCommentId FROM \`UserCommentFlagged\` AS \`UserCommentFlagged\` WHERE \`ForumComment\`.\`forumCommentId\` = \`UserCommentFlagged\`.\`forumCommentId\` AND \`UserCommentFlagged\`.\`userId\` = ${userId})`
                    ),
                },
            },
            include: [
                // Include the associated Images
                {
                    model: Image,
                    as: 'images',
                },
            ],
        });

        res.status(200).json(forumComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllForumCommentByUserId = async (req, res) => {
    try {
        const increase = JSON.parse(req.query.increase);
        const userId = parseInt(req.params.userId);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let orderCriteria = [['updatedAt', 'DESC']];

        if (increase) {
            orderCriteria = [['updatedAt', 'ASC']];
        }

        const forumComments = await user.getForumComments({
            order: orderCriteria,
            where: {
                isInappropriate: {
                    [Sequelize.Op.not]: true,
                },
            },
            include: [
                {
                    model: Image,
                    as: 'images',
                },
            ],
        })

        console.log(forumComments)
        res.status(200).json(forumComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllUserUpvotedForumComment = async (req, res) => {
    try {
        const increase = JSON.parse(req.query.increase);
        const userId = parseInt(req.params.userId);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let orderCriteria = [['updatedAt', 'DESC']];

        if (increase) {
            orderCriteria = [['updatedAt', 'ASC']];
        }

        const forumComments = await ForumComment.findAll({
            order: orderCriteria,
            where: {
                isInappropriate: {
                    [Sequelize.Op.not]: true,
                },
                forumCommentId: {
                    [Sequelize.Op.notIn]: Sequelize.literal(
                        `(SELECT forumCommentId FROM \`UserCommentFlagged\` AS \`UserCommentFlagged\` WHERE \`ForumComment\`.\`forumCommentId\` = \`UserCommentFlagged\`.\`forumCommentId\` AND \`UserCommentFlagged\`.\`userId\` = ${userId})`
                    ),
                    [Sequelize.Op.in]: Sequelize.literal(
                        `(SELECT forumCommentId FROM \`UserCommentUpvoted\` AS \`UserCommentUpvoted\` WHERE \`ForumComment\`.\`forumCommentId\` = \`UserCommentUpvoted\`.\`forumCommentId\` AND \`UserCommentUpvoted\`.\`userId\` = ${userId})`
                    ),
                },
            },
            include: [
                {
                    model: Image,
                    as: 'images',
                },
            ],
        });

        // console.log(forumComments)
        res.status(200).json(forumComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllUserDownvotedForumComment = async (req, res) => {
    try {
        const increase = JSON.parse(req.query.increase);
        const userId = parseInt(req.params.userId);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let orderCriteria = [['updatedAt', 'DESC']];

        if (increase) {
            orderCriteria = [['updatedAt', 'ASC']];
        }

        const forumComments = await ForumComment.findAll({
            order: orderCriteria,
            where: {
                isInappropriate: {
                    [Sequelize.Op.not]: true,
                },
                forumCommentId: {
                    [Sequelize.Op.notIn]: Sequelize.literal(
                        `(SELECT forumCommentId FROM \`UserCommentFlagged\` AS \`UserCommentFlagged\` WHERE \`ForumComment\`.\`forumCommentId\` = \`UserCommentFlagged\`.\`forumCommentId\` AND \`UserCommentFlagged\`.\`userId\` = ${userId})`
                    ),
                    [Sequelize.Op.in]: Sequelize.literal(
                        `(SELECT forumCommentId FROM \`UserCommentDownvoted\` AS \`UserCommentDownvoted\` WHERE \`ForumComment\`.\`forumCommentId\` = \`UserCommentDownvoted\`.\`forumCommentId\` AND \`UserCommentDownvoted\`.\`userId\` = ${userId})`
                    ),
                },
            },
            include: [
                {
                    model: Image,
                    as: 'images',
                },
            ],
        });

        // console.log(forumComments)
        res.status(200).json(forumComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllUserFlaggedForumComment = async (req, res) => {
    try {
        const increase = JSON.parse(req.query.increase);
        const userId = parseInt(req.params.userId);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let orderCriteria = [['updatedAt', 'DESC']];

        if (increase) {
            orderCriteria = [['updatedAt', 'ASC']];
        }

        const forumComments = await ForumComment.findAll({
            order: orderCriteria,
            where: {
                isInappropriate: {
                    [Sequelize.Op.not]: true,
                },
                forumCommentId: {
                    [Sequelize.Op.in]: Sequelize.literal(
                        `(SELECT forumCommentId FROM \`UserCommentFlagged\` AS \`UserCommentFlagged\` WHERE \`ForumComment\`.\`forumCommentId\` = \`UserCommentFlagged\`.\`forumCommentId\` AND \`UserCommentFlagged\`.\`userId\` = ${userId})`
                    ),
                },
            },
            include: [
                {
                    model: Image,
                    as: 'images',
                },
            ],
        });

        // console.log(forumComments)
        res.status(200).json(forumComments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getForumCommentVoteDetails = async (req, res) => {
    try {

        const userId = parseInt(req.params.userId);
        const forumCommentId = parseInt(req.params.forumCommentId);
        const forumComment = await ForumComment.findByPk(forumCommentId);

        if (!forumComment) {
            return res.status(404).json({ message: 'ForumComment not found' });
        }

        const userUpvote = await forumComment.hasUsersUpvoted(userId);
        const userDownvote = await forumComment.hasUsersDownvoted(userId);
        const totalUpvote = await forumComment.countUsersUpvoted();
        const totalDownvote = await forumComment.countUsersDownvoted();

        const voteDetails = {
            userUpvote,
            userDownvote,
            totalUpvote,
            totalDownvote,
        };


        res.status(200).json(voteDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateForumCommentFlaggedStatus = async (req, res) => {
    try {
        const forumCommentId = parseInt(req.params.forumCommentId);
        const userId = parseInt(req.params.userId);

        // Check if the ForumComment exists
        const forumComment = await ForumComment.findByPk(forumCommentId);

        if (!forumComment) {
            return res.status(404).json({ message: 'ForumComment not found' });
        }

        // Check if the user is already flagged for the Comment
        const isFlagged = await forumComment.hasUsersFlagged(userId);
        console.log("User ID: " + userId + " Forum Comment ID: " + forumCommentId)
        // console.log("is Flagged? " + isFlagged)

        const user = await User.findByPk(userId);

        req.body = {
            "isRecent": false,
            "isPending": false,
            "isCompleted": true,
            "hasRead": false,
            "userId": userId
        };

        if (isFlagged) {
            // If the user is flagged, remove the flag
            await forumComment.removeUsersFlagged(userId);

            req.body.content = `${user.userName.charAt(0).toUpperCase() + user.userName.slice(1)} has removed the flag on the forum comment message of "${forumComment.message}"`;

            await Notification.create(req.body);

            req.io.emit("newRemoveFlaggedForumCommentNotification", `Remove flagged forum comment`);

            res.status(200).json({ message: 'Flag removed successfully' });
        } else {
            // If the user is not flagged, add the flag
            await forumComment.addUsersFlagged(userId);

            req.body.content = `${user.userName.charAt(0).toUpperCase() + user.userName.slice(1)} has flagged the forum comment message of "${forumComment.message}"`;

            await Notification.create(req.body);

            req.io.emit("newFlaggedForumCommentNotification", `Flagged forum comment`);

            res.status(200).json({ message: 'Flag added successfully' });
        }

        await forumComment.save();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateForumCommentVote = async (req, res) => {
    try {
        const forumCommentId = parseInt(req.params.forumCommentId);
        const userId = parseInt(req.params.userId);
        const { voteType } = req.query;

        // Check if the user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the Comment exists
        const forumComment = await ForumComment.findByPk(forumCommentId);
        if (!forumComment) {
            return res.status(404).json({ message: 'Forum Comment not found' });
        }

        // Check if the user has already voted on this Comment
        const existingUpvote = await forumComment.hasUsersUpvoted(user);
        const existingDownvote = await forumComment.hasUsersDownvoted(user)

        // Create a new vote record based on the user's choice
        if (voteType === 'upvote') {
            if (existingUpvote) {
                await forumComment.removeUsersUpvoted(user);
            } else {
                if (existingDownvote) {
                    await forumComment.removeUsersDownvoted(user);
                }
                await forumComment.addUsersUpvoted(user);
            }
        } else if (voteType === 'downvote') {
            if (existingDownvote) {
                await forumComment.removeUsersDownvoted(user);
            } else {
                if (existingUpvote) {
                    await forumComment.removeUsersUpvoted(user);
                }
                await forumComment.addUsersDownvoted(user);
            }
        } else {
            return res.status(400).json({ message: 'Invalid vote type' });
        }
        await forumComment.save();

        res.status(200).json({ message: `${voteType} recorded successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateForumComment = async (req, res) => {
    try {
        const forumCommentId = parseInt(req.body.forumCommentId);
        const userId = parseInt(req.params.userId);

        // Check if the user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the Comment exists
        const forumComment = await ForumComment.findByPk(forumCommentId);
        if (!forumComment) {
            return res.status(404).json({ message: 'Forum Comment not found' });
        }

        // Check if the user owns the forum Comment
        if (forumComment.userId !== userId) {
            return res.status(403).json({ message: 'You do not have permission to update this Comment' });
        }

        if (req.body.title != null) {
            forumComment.title = req.body.title;
        }

        if (req.body.message != null) {
            forumComment.message = req.body.message;
        }

        await forumComment.save();

        res.status(200).json({ message: `Comment ID${forumCommentId}: Comment name successfully updated` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteForumComment = async (req, res) => {
    try {
        const forumCommentId = parseInt(req.params.forumCommentId);
        const userId = parseInt(req.params.userId);


        // Check if the user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the Comment exists
        const forumComment = await ForumComment.findByPk(forumCommentId);
        if (!forumComment) {
            return res.status(404).json({ message: 'Forum Comment not found' });
        }

        // Check if the user owns the forum Comment
        if (forumComment.userId !== userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this Comment' });
        }

        // Delete the forum Comment
        await forumComment.destroy();

        res.status(200).json({ message: `Comment ID ${forumCommentId}: Comment successfully deleted` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createForumComment,
    getAllForumComment,
    updateForumCommentFlaggedStatus,
    updateForumCommentVote,
    updateForumComment,
    deleteForumComment,
    getForumCommentVoteDetails,
    getAllForumCommentByUserId,
    getAllUserUpvotedForumComment,
    getAllUserDownvotedForumComment,
    getAllUserFlaggedForumComment

};