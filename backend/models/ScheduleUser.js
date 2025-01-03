module.exports = (sequelize, DataTypes) => {
    const ScheduleUser = sequelize.define("ScheduleUser", {
        scheduleUserId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
    }, {
        freezeTableName: true
    });

    return ScheduleUser;
};

