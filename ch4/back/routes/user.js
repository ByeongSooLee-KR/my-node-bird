const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const { User } = require('../models'); // db = require('../models')를 구조분해 할당한 것 

const router = express.Router();

// router.post('/login', passport.authenticate('local', (err, user, info) => {
//     if (err) {
//         console.err(err);
//         next(err); // -> 밑의 router와 다르게 passport는 req,res,next 등을 쓸 수 없게된다 
//                          따라서 미들웨어를 아래와 같이 확장해준다. 
//     }
// })); //전략이 실행됨, 두 번쨰 인자는 local.js에서 세운 전략에 따라 done 콜백을 가져옴 

//passport.authenticate는 (req, res, next)를 쓸 수 없는 미들웨어인데 아래와 같이 확장해서 쓸 수 있게하는 Express의 기법이다.
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('err2: ',err);
            return next(err);
        }

        if (info) {
            return res.status(401).send(info.reason);
        }

        return req.login(user, async (loginErr) => {
            if (loginErr) {
                // 우리 로그인 과정을 지나면 패스포트 로그인을 거치는 데 이때 나는 에러 (거의 발생하지 않음)
                console.error(loginErr);
                return next(loginErr);
            }
            return res.status(200).json(user);
        });
    })(req, res, next);
});

router.post('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.send('ok');
}); 

router.post('/', async (req, res, next) => { // POST/user
    try {
        const exUser = await User.findOne({
            where: {
                email: req.body.email,
            }
        })
        if(exUser) {
            return res.status(403).send('이미 사용 중인 아이디입니다');
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12); // 높을 수록 좋긴 한데 서버 성능에 따라 달리하는 게 좋음
        await User.create({ // db 저장 
            email: req.body.email,
            nickname: req.body.nickname,
            password: hashedPassword,
        });
        res.send('ok');
    }catch(error) {
        console.error(error);
        next(error); // status 500 
    }

});
 
module.exports = router;
