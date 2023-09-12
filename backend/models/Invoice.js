module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define("Invoice", {
        invoiceId: {
            type: DataTypes.BIGINT,
            primaryKey: true, // Set requestId as the primary key
            autoIncrement: true, // Enable auto-increment
        },
        timestamp: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        stripePaymentResponse: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        freezeTableName: true
    })

    Invoice.associate = (models) => {
        Invoice.hasOne(models.Transaction, {
            foreignKey: {
                name: 'invoiceId',
                allowNull: false, 
            }, 
            onDelete: 'CASCADE', // If an invoice is deleted, delete the associated transaction
        });
    };

    return Invoice;
}
