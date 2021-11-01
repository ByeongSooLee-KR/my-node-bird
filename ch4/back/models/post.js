module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define(
        'Post',
        {
            // MySQL에는 Posts 테이블 생성
            //id가 기본적으로 들어있다.
            content: {
                type: DataTypes.TEXT, // STRING, TEXT, BOOLEAN, INTEGER, FLOAT, DATETIME
                allowNull: false, // 필수
            },
        },
        {
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci', //이모티콘 저장
        }
    );
    Post.associate = (db) => {
        db.Post.belongsTo(db.User); // 포스트는 작성자에 속해 있다.
        db.Post.hasMany(db.Comment); // 한 포스트에 여러개의 댓글이 있을 수 있다.
        db.Post.hasMany(db.Image); // 한 포스트에 여러개의 이미지가 있을 수 있다.
        db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' }); // 해쉬태그와 다대다 관계.
        db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' }); // 위에 것과 헷갈리지 않기 위해 as로 별칭 붙인다. 나중에 as에 따라서 post.getLikers로 게시글 좋아요 누른 사람을 가져올 수 있다.
        db.Post.belongsTo(db.Post, { as: 'Retweet' }); 

    };;
    return Post; 
}