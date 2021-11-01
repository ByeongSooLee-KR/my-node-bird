module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define(
        'Comment',
        {
            content: {
                type: DataTypes.TEXT, // STRING, TEXT, BOOLEAN, INTEGER, FLOAT, DATETIME
                allowNull: false, // 필수
            },
            //UserId: 1
            //PostId: 3
        },
        {
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci', //이모티콘 저장
        }
    );
    Comment.associate = (db) => {
        // hasMany는 큰의미가 없지만 belongsTo는 collumn 을 만들어 준다
        db.Comment.belongsTo(db.User); // 댓글은 유저에 속해 있다
        db.Comment.belongsTo(db.Post); // 댓글은 포스트에 속해 있다
    };
    return Comment; 
}