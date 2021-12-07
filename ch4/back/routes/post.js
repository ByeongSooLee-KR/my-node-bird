const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Image, Comment, User, Hashtag } = require('../models');
const { isLoggedIn } = require('./middleware')
const router = express.Router();

try {
  fs.accessSync('uploads');
} catch (error) {
  console.log('uploads 폴더가 없으므로 생성합니다');
  fs.mkdirSync('uploads');
};

const upload = multer({
    storage: multer.diskStorage({
        // 후에 s3로 대체
        destination(req, file, done) {
            done(null, 'uploads');
        },
        filename(req, file, done) {
            // 병수.png
            const ext = path.extname(file.originalname); // 확장자 추출 (.png)
            const basename = path.basename(file.originalname, ext); // 병수
            done(null, basename + '_' + new Date().getTime() + ext); // 병수123141535312.png  -> 덮어 씌워지는 것을 방지
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.post('/', isLoggedIn, upload.none(), async(req, res) => { // POST /post
    try {
        const hashtags = req.body.content.match(/#[^\s#]+/g);
        const post = await Post.create({
          content: req.body.content,
          UserId: req.user.id,
        })
        if(hashtags) {
          const result = await Promise.all(hashtags.map((tag) => Hashtag.findOrCreate({ 
            where: { name: tag.slice(1).toLowerCase() },
          }))) // findOrCreate -> 없을때면 등록해라 결과물이 [[노드, true], [리액트,true]]라서 한번더 map이 필요하다
          await post.addHashtags(result.map((v)=> v[0]));
        }
        if(req.body.image) {
          if(Array.isArray(req.body.image)) { // 이미지를 여러 개 올미면 image:[제로초.png, 부기초.png]
            const images = await Promise.all(req.body.image.map((image) => Image.create({ src: image })));
            await post.addImages(images);
          } else { // 이미지를 하나만 올리면 image : 제로초.png
            const image = await Image.create({ src: req.body.image })
            await post.addImages(image);
            }
        }
        const fullPost = await Post.findOne({
            where: { id: post.id },
            include: [
                {
                    model: Image,
                },
                {
                    model: Comment, // 댓글 작성자
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'nickname'],
                        },
                    ],
                },
                {
                    model: User, // 게시글 작성자
                    attributes: ['id', 'nickname'],
                },
                {
                    model: User, // 좋아요 누른 사람
                    as: 'Likers',
                    attributes: ['id'],
                },
            ],
        });
        res.status(201).json(fullPost);
    } catch(error) {
        console.error(error)
        next(error);
    }
});

router.post('/:postId/comment',isLoggedIn,  async (req, res) => { // POST /post/1/comment
    //postId처럼 동적으로 바뀌는 것을 파라미터라고 함 
    try {
        const post = await Post.findOne({
            where: {
                id: req.params.postId
            }
        });
        if(!post) {
            return res.status(401).send('존재하지 않는 게시글입니다.')
        }
        const comment = await Comment.create({
            content: req.body.content,
            PostId: parseInt(req.params.postId, 10), // params는 string이므로 
            UserId: req.user.id,
        });
        const fullComment = await Comment.findOne({
          where: { id: comment.id },
          include: [{
            model: User,
            attributes: ['id', 'nickname'],
          }]
        })

        res.status(201).json(fullComment);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => {
    // POST /post/1/retweet
    try {
        const post = await Post.findOne({
            where: {
                id: req.params.postId,
            },
            include: [
                {
                    model: Post,
                    as: 'Retweet',
                },
            ],
        });
        if (!post) {
            return res.status(401).send('존재하지 않는 게시글입니다.');
        }
        if (
            req.user.id === post.UserId ||
            (post.Retweet && post.Retweet.UserId === req.user.id)
        ) {
            // 자기가 올린 글을 리트윗 하거나 자기가 올린 글을 다른 사람이 리트윗한 걸 다시 리트윗 하는 경우
            return res
                .status(403)
                .send('자신이 올린 글을 리트윗할 수 없습니다.');
        }
        const retweetTargetId = post.RetweetId || post.id;
        const exPost = await Post.findOne({
            where: {
                UserId: req.user.id,
                RetweetId: retweetTargetId,
            },
        });
        if (exPost) {
            return res.status(403).send('이미 리트윗했습니다.');
        }
        const retweet = await Post.create({
            UserId: req.user.id,
            RetweetId: retweetTargetId,
            content: 'retweet',
        });
        const retweetWithPrevPost = await Post.findOne({
            where: { id: retweet.id },
            include: [
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
                {
                    model: User,
                    attributes: ['id', 'nickname'],
                },
                {
                    model: Image,
                },
                {
                    model: Comment,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'nickname'],
                        },
                        {
                            model: User,
                            as: 'Likers',
                            attributes: ['id'],
                        },
                    ],
                },
            ],
        });
        res.status(201).json(retweetWithPrevPost);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/:postId', async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'nickname'],
                },
                {
                    model: Image,
                },
                {
                    model: Comment,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'nickname'],
                            order: [['createdAt', 'DESC']],
                        },
                    ],
                },
                {
                    model: User, // 좋아요 누른 사람
                    as: 'Likers',
                    attributes: ['id'],
                },
            ],
        });
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
    // PATCH /post/1/like
    try {
        const post = await Post.findOne({
            where: {
                id: req.params.postId,
            },
        });
        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다');
        }
        await post.addLikers(req.user.id); // db조작할때는 꼭 await 붙여줘야함
        res.json({ PostId: post.id, UserId: req.user.id });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: {
        id: req.params.postId
      }
    })
    if(!post) {
      return res.status(403).send('게시글이 존재하지 않습니다');
    }
    await post.removeLikers(req.user.id); // db조작할때는 꼭 await 붙여줘야함
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId', isLoggedIn, async (req, res, next) => { // DELETE /post
  try {
    await Post.destroy({
      where : {
        id: req.params.postId,
        UserId: req.user.id, // 게시글 아이디만 할 경우 다른 사람이 삭제할 수 있으므로 보안상 추가
      }
    })
    res.json({ PostId: parseInt(req.params.postId, 10) });
  } catch(error) {
    console.error(error)
  }
});


router.post('/images', isLoggedIn, upload.array('image'), async (req, res, next) => { // POST /post/images
  try{
    res.json(req.files.map((v) => v.filename));
  } catch(error) {
    console.error(error)
  }
})

module.exports = router;