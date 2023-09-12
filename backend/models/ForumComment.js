module.exports = (sequelize, DataTypes) => {
    const ForumComment = sequelize.define("ForumComment", {
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        likes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dislikes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        isInappropriate: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        images: {
            type: DataTypes.BLOB, // there is no array for BLOB. so either we use postgresql as sequelize offer arrays datatype for postgresql or we create an Images entity referencing to those entities require image and then the single image is in BLOB
            allowNull: false,
        },
    }, {
        freezeTableName: true
    }
    )

    return ForumComment;
}