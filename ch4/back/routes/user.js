const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');

const { User, Post, Comment, Image } = require('../models'); // db = require('../models')를 구조분해 할당한 것 
const { isLoggedIn, isNotLoggedIn } = require('./middleware');
const db = require('../models');

const router = express.Router();

router.get('/', async(req,res,next) => {
    try {
        if(req.user) {
            const fullUserWithoutPassowrd = await User.findOne({
                where: { id: req.user.id },
                attributes: {
                    exclude: ['password'], // 해당 속성만 안가져오고 싶을 때
                }, // 해당 테이블에서 가져 오고 싶은 속성들만 가져 오려면 이렇게 attributes: ['id', 'nickname', 'email']
                include: [
                    // 다른 테이블 합칠 때
                    {
                        // sequelize가 알아서 배열 안의 db의 테이블들을 합쳐줌
                        model: Post,
                        attributes: ['id'],
                    },
                    {
                        model: User,
                        as: 'Followings',
                        attributes: ['id'],
                    },
                    {
                        model: User,
                        as: 'Followers',
                        attributes: ['id'],
                    },
                ],
            });
            res.status(200).json(fullUserWithoutPassowrd);
        } else {
            res.status(200).json(null);
        }
    } catch(error) {
        console.error(error)
    }

})

router.get('/followers', isLoggedIn, async (req, res, next) => {
    // GET /user/followers
    try {
        const user = await User.findOne({ where: { id: req.user.id } });
        if (!user) {
            res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
        }
        const followers = await user.getFollowers({
            limit: parseInt(req.query.limit,10),
        });
        res.status(200).json(followers);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/followings', isLoggedIn, async (req, res, next) => {
    // GET /user/followers
    try {
        const user = await User.findOne({ where: { id: req.user.id } });
        if (!user) {
            res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
        }
        const followings = await user.getFollowings({
            limit: parseInt(req.query.limit,10),
        });
        res.status(200).json(followings);
    } catch (error) {
        console.error(error);
        next(error);
    }
}); 
// -> 이거 아래 라우터 /:userId (params 혹은 와일드카드)보다 밑에 있으면 /followgins, /follwers가 /:userId로 인식해버린다.
// 그렇기 때문에 파람스 라우터보다 위에 있어야 된다. 
router.get('/:userId', async (req, res, next) => {
    try {
            const fullUserWithoutPassowrd = await User.findOne({
                where: { id: req.params.userId },
                attributes: {
                    exclude: ['password'], // 해당 속성만 안가져오고 싶을 때
                }, // 해당 테이블에서 가져 오고 싶은 속성들만 가져 오려면 이렇게 attributes: ['id', 'nickname', 'email']
                include: [
                    // 다른 테이블 합칠 때
                    {
                        // sequelize가 알아서 배열 안의 db의 테이블들을 합쳐줌
                        model: Post,
                        attributes: ['id'],
                    },
                    {
                        model: User,
                        as: 'Followings',
                        attributes: ['id'],
                    },
                    {
                        model: User,
                        as: 'Followers',
                        attributes: ['id'],
                    },
                ],
            });
        if(fullUserWithoutPassowrd) {
            const data = fullUserWithoutPassowrd.toJSON(); // sequelize에서 보내준 data는 JSON이 아니므로 
            data.Posts = data.Posts.length;
            data.Followers = data.Followers.length;
            data.Followings = data.Followings.length;
            res.status(200).json(data);
        }
        else {
            res.status(404).json('존재하지 않는 사용자입니다.');
        }
    } catch (error) {
        console.error(error);
    }
});

router.get('/:userId/posts', async (req, res, next) => {
    // GET /user/1/posts
    try {
        const where = { UserId: req.params.userId };
        if (parseInt(req.query.lastId, 10)) {
            where.id = { [Op.lt]: parseInt(req.query.lastId, 10) }; // 조건: lastId보다 작은
        }
        const posts = await Post.findAll({
            where,
            limit: 10,
            order: [
                ['createdAt', 'DESC'],
                [Comment, 'createdAt', 'DESC'],
            ],
            include: [
                {
                    model: User, // 게시글 작성자
                    attribute: ['id', 'nickname'], // User 정보를 가져올 때는 비밀번호까지 가져오는 것을 조심해야한다.
                },
                {
                    model: Image,
                },
                {
                    model: Comment, // 댓글 작성자
                    include: [
                        {
                            model: User,
                            attribute: ['id', 'nickname'],
                        },
                    ],
                },
                {
                    model: User, // 좋아요 누른 사람 -> 위에 User와 구분하기 위해서 as을 갖고 와야된다.
                    as: 'Likers',
                    attribute: ['id'],
                },
                {
                    model: Post,
                    as: 'Retweet',
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'nickname'],
                        },
                        {
                            model: Image,
                        },
                    ],
                },
            ],
        });
        res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        next(error);
    }
});
// router.post('/login', passport.authenticate('local', (err, user, info) => {
//     if (err) {
//         console.err(err);
//         next(err); // -> 밑의 router와 다르게 passport는 req,res,next 등을 쓸 수 없게된다 
//                          따라서 미들웨어를 아래와 같이 확장해준다. 
//     }
// })); //전략이 실행됨, 두 번쨰 인자는 local.js에서 세운 전략에 따라 done 콜백을 가져옴 

//passport.authenticate는 (req, res, next)를 쓸 수 없는 미들웨어인데 아래와 같이 확장해서 쓸 수 있게하는 Express의 기법이다.
router.post('/login', isNotLoggedIn, (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (info) {
      return res.status(401).send(info.reason);
    }

    return req.login(user, async (loginErr) => {
      if (loginErr) {
          // 우리 로그인 과정을 지나면 패스포트 로그인을 거치는 데 이때 나는 에러 (거의 발생하지 않음)
        return next(loginErr);
      }
        // 지금 가져오는 user는 보안상 없어야 히는 패스워드가 들어있고 필요한 Post의 정보가 없다. 그래서 
        // 사용자 정보를 가저오면서 include를 통해 Post의 정보를 가져온다. 
      const fullUserWithoutPassowrd = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclude: ['password'], // 해당 속성만 안가져오고 싶을 때
        }, // 해당 테이블에서 가져 오고 싶은 속성들만 가져 오려면 이렇게 attributes: ['id', 'nickname', 'email']
        include: [
          // 다른 테이블 합칠 때
          {
              // sequelize가 알아서 배열 안의 db의 테이블들을 합쳐줌
              model: Post,
              attributes: ['id'], // 우리가 필요한건 length이므로 full 정보가 필요없다(데이터 효율) -> 프런트에 필요한 데이터를 보내주는게 중요하다.
          },
          {
              model: User,
              as: 'Followings',
              attributes: ['id'],
          },
          {
              model: User,
              as: 'Followers',
              attributes: ['id'],
          },
        ],
      });
      return res.status(200).json(fullUserWithoutPassowrd);
    });
  })(req, res, next);
});

router.post('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('ok');
}); 

router.post('/',isNotLoggedIn, async (req, res, next) => { // POST/user
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

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
    try {
        await User.update(
          {
              nickname: req.body.nickname,
          },
          {
              where: {
                  id: req.user.id,
              },
          }
        );
        res.status(200).json({ nickname: req.body.nickname });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => { // PATCH user/1/follow
    try {
      const user = await User.findOne({ where: { id: req.params.userId }})
      if(!user) {
        res.status(403).send('없는 사람을 팔로우하려고 하시네요?')
      }
      await user.addFollowers(req.user.id);
      res.status(200).json({ UserId: parseInt(req.params.userId,10)});

    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => { // DELETE UNFOLLOW user/1/follow
    try {
      const user = await User.findOne({ where: { id: req.params.userId } });
      if (!user) {
          res.status(403).send('없는 사람을 팔로우하려고 하시네요?');
      }
      await user.removeFollowers(req.user.id);
      res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
    } catch (error) {
        console.error(error);
    }
});

router.delete('/follower/:userId', isLoggedIn, async (req, res, next) => { //DELETE user/follower/1
    try {
      const user = await User.findOne({ where: { id: req.params.userId } });
      if (!user) {
          res.status(403).send('없는 사람을 차단하려고 하시네요?');
      }
      await user.removeFollowings(req.user.id);
      res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
    } catch (error) {
        console.error(error);
    }
});




 
module.exports = router;
