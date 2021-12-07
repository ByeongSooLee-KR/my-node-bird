const express = require('express');

const postRouter = require('./routes/post');
const postsRouter = require('./routes/posts');

const hashtagRouter = require('./routes/hashtag');
const userRouter = require('./routes/user');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const passportConfig = require('./passport');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

const db = require('./models');
const passport = require('passport');
const app = express();

dotenv.config() // dotenv만 잘 관리한다면 소스코드가 털려도 개인정보를 보호해줄 수 있음 

db.sequelize.sync()
    .then(() => {
        console.log('db 연결 성공');
    })
    .catch(console.error);

passportConfig();

app.use(morgan('dev'));


// front에서 보내준 data를 해석해서 req body로 넣어주는 역할
// router보다 위에 있어야 한다. 
app.use('/', express.static(path.join(__dirname, 'uploads'))); // dirname: 현재의 폴더네임 안에 upload로 합쳐준다. 
// path.join을 쓰는 이유는 __dirname + '/uploads' 맥이나 리눅스의 경우 \uploads로 경로가 되기 때문에 운영체제에 맞게 path.join을 쓴다.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
app.use(cookieParser(process.env.COOKIE_SECRET)); 
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(
    cors({
        origin: 'http://localhost:3060',
        credentials: true,
        // 모든 cors를 허용하겠다 하지만 보안상의 이슈로 origin: '도메인주소' 로 설정해준다
    })
); 

app.get('/', (req, res) => {
    res.send('hello express');
})

app.get('/api', (req, res) => {
    res.send('hello api!!!~');
});   

// // post 와 delete의 경우 postman을 통해 확인 브라우저 주소창은 get요청이기 때문
// app.post('/post', (req, res) => {
//     res.json({ id: 1, content : 'hello' });
// }); 

// app.delete('/post', (req, res) => {
//     res.json({ id: 1 });
// }); -> postRotuer로 아래와 같이 라우터 분리

app.use('/post',postRouter); // /post가 중복일 경우 prefix로 붙일 수 있음 
app.use('/posts',postsRouter); // /post가 중복일 경우 prefix로 붙일 수 있음 

app.use('/user',userRouter); 
app.use('/hashtag', hashtagRouter); 



app.listen(3065, () => {
    console.log('서버 실행중')
});