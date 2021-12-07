module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            // MySQL에는 users 테이블 생성
            //id가 기본적으로 들어있다.
            email: {
                type: DataTypes.STRING(30), // STRING, TEXT, BOOLEAN, INTEGER, FLOAT, DATETIME
                allowNull: false, // 필수
                unique: true, // 고유한 값 
            }, // 컬럼
            nickname: {
                type: DataTypes.STRING(30),
                allowNull: false, // 필수
            },
            password: {
                type: DataTypes.STRING(100), // 암호화 대비 100글자 넉넉하게 
                allowNull: false, // 필수
            },
        },
        {
            // 두 번째 객체는 유저 모델에 대한 세팅
            charset: 'utf8',
            collate: 'utf8_general_ci', //한글 저장
        }
    );
    User.associate = (db) => {
        db.User.hasMany(db.Post); // 사람이 Post를 여러개 가질 수 있다.
        db.User.hasMany(db.Comment); // 한 사람이 여러개의 리뷰를 가질 수 있다.
        db.User.belongsToMany(db.Post, { through: 'Like', as: 'Liked' });
        db.User.belongsToMany(db.User, { through: 'Follow', as: 'Followers', foreignKey: 'FollowingId'  });  
        // 위에 꺼와 달리 foreignkey를 붙여주는 이유는 User와 Post는 각각의 id로 구분할 수 있으나 같은 테이블일때 구분자를 만들어 주기 위함이다.
        db.User.belongsToMany(db.User, { through: 'Follow', as: 'Followings', foreignKey: 'FollowerId' });
    };
    return User; 
}