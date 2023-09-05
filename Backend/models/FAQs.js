module.exports = (sequelize, DataTypes) => {
    const FAQs = sequelize.define("FAQs", {
        faqId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        question: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        answer: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });

    FAQs.associate = (models) => {
        FAQs.belongsTo(models.Admins, {
            foreignKey: {
                name: 'adminId'
            }
        });
    };

    return FAQs;
}