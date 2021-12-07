const express = require('express');
const { Op } = require('sequelize');
//Op는 Operator:연산자
const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

router.get('/', async (req,res,next) => { // GET /posts 
  try {
    const where = {};
    if(parseInt(req.query.lastId, 10)) {
      where.id = { [Op.lt]: parseInt(req.query.lastId,10) } // 조건: lastId보다 작은
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

module.exports = router;