// 모듈 불러오기
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

var template = {
    html: function (title, list, body, control) {
        return `
        <html>
        <head>
            <title>WEB1 - ${title}</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1><a href="/">WEB</a></h1>
                ${list}
                ${control}
                ${body} <!-- 원래는 <h2>{title}</h2>{description} -->
        </body>
        </html>
        `;
    },
    list: function (filelist) {
        var list = '<ul>'; // list 시작
        var i = 0;
        while (i < filelist.length) {
            list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`; // list 항목 별 링크
            i = i + 1;
        }

        list = list + '</ul>'; // list 종료
        return list;
    }
}

function templateHTML(title, list, body, control) {
    return `
        <html>
        <head>
            <title>WEB1 - ${title}</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1><a href="/">WEB</a></h1>
                ${list}
                ${control}
                ${body} <!-- 원래는 <h2>{title}</h2>{description} -->
        </body>
        </html>
        `;
}

function templateList(filelist) {
    var list = '<ul>'; // list 시작
    var i = 0;
    while (i < filelist.length) {
        list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`; // list 항목 별 링크
        i = i + 1;
    }

    list = list + '</ul>'; // list 종료
    return list;
}

// 서버 on 부분
var app = http.createServer(function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if (pathname === '/') { // 메인페이지
        if (queryData.id === undefined) {
            fs.readdir('./data', function (error, filelist) {
                console.log(filelist);
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = template.list(filelist);
                var html = template.html(title, list,
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create</a>`
                );
                response.writeHead(200);
                response.end(html);
            })
        } else { // 1,2,3 각 페이지
            fs.readdir('./data', function (error, filelist) {
                fs.readFile(`data/${queryData.id}`, 'utf8', function (err, description) {
                    var title = queryData.id;
                    var list = template.list(filelist);
                    var html = template.html(title, list, `<h2>${title}</h2>${description}`,
                        `<a href="/create">create</a>
                                 <a href="/update?id=${title}">update</a>
                                 <form action="delete_process" method="post">
                                    <input type="hidden" name="id" value="${title}">
                                    <input type="submit" value="delete">
                                 </form>
                                `
                    );
                    response.writeHead(200);
                    response.end(html);
                });
            });
        }
    } else if (pathname === '/create') {
        fs.readdir('./data', function (error, filelist) {
            console.log(filelist);
            var title = 'WEB - create';
            var list = template.list(filelist);
            var html = template.html(title, list, `
                <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                </form>
            `, '');
            response.writeHead(200);
            response.end(html);
        })

    } else if (pathname === '/create_process') {
        // var body = '';
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body); //post 변수에 위에 폼태그 내용 저장
            var title = post.title; //위에 폼태그 title 읽어들임
            var description = post.description; //위에 폼태그 description 읽어들임
            fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end();
            });
        });
    } else if (pathname === '/update') {
        fs.readdir('./data', function (error, filelist) {
            fs.readFile(`data/${queryData.id}`, 'utf8', function (err, description) {
                var title = queryData.id;
                var list = template.list(filelist);
                var html = template.html(title, list,
                    `
                    
                    <form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${title}">
                    <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                    <p>
                        <textarea name="description" placeholder="description">${description}</textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                    </form>
                    
                    `,
                    `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
                );
                response.writeHead(200);
                response.end(html);
            });
        });
    } else if (pathname === '/update_process') {
        // var body = '';
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body); //post 변수에 위에 폼태그 내용 저장
            var id = post.id; // id값 받음
            var title = post.title; //위에 폼태그 title 읽어들임
            var description = post.description; //위에 폼태그 description 읽어들임
            fs.rename(`data/${id}`, `data/${title}`, function (error) {
                fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                    response.writeHead(302, {Location: `/?id=${title}`});
                    response.end();
                });
            });
        });
    } else if (pathname === '/delete_process') { // 삭제기능
        var body = '';
        request.on('data', function (data) {
            body = body + data;
        });
        request.on('end', function () {
            var post = qs.parse(body); //post 변수에 위에 폼태그 내용 저장
            var id = post.id; // id값 받음
            fs.unlink(`data/${id}`, function (error) {
                response.writeHead(302, {Location: `/`});
                response.end();
            });
        });
    } else {
        response.writeHead(404);
        response.end('Not Found');
    }
});
app.listen(3000);