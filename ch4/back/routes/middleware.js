exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) { // passport에서 제공하는 것  
        next();// 인자에 에러가 있다면 에러처리로 가지만 없다면 다음 미들웨어로 이동
    } else {
        res.status(401).send('로그인이 필요합니다');
    } 
}

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        res.status(401).send('로그인하지 않은 사용자만 접근 가능합니다.');
    }
};