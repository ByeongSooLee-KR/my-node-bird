module.exports = (sequelize, DataTypes) => {
    const HashTag = sequelize.define(
        'HashTag',
        {
            name: {
                type: DataTypes.STRING(20), // STRING, TEXT, BOOLEAN, INTEGER, FLOAT, DATETIME
                allowNull: false, // 필수
            },
        },
        {
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci', //이모티콘 저장
        }
    );
    HashTag.associate = (db) => {
        db.Hashtag.belongsToMany(db.Post, { through : 'PostHashtag' }); // 포스트와와 다대다 관계.
    };
    return HashTag; 
}