const db = require("../db/connection");
const { find, forEach } = require("../db/data/test-data/articles");
const { checkExists } = require("../db/db-utils/db-utils");

exports.selectTopics = () => {
    return db.query('SELECT * FROM topics;')
        .then(({rows}) => {
            return rows;
        });
};

exports.selectUsers = () => {
    return db.query(`
        SELECT username, name, avatar_url
        FROM users;
    `)
    .then(({rows}) => {
        return rows;
    });
};

exports.selectArticleById = (article_id) => {
    return db.query(`
    SELECT COUNT(comments.article_id)::INT AS comment_count , articles.*
    FROM comments
    RIGHT JOIN articles 
    ON comments.article_id = articles.article_id
    WHERE articles.article_id = $1
    GROUP BY articles.article_id
    ORDER BY articles.created_at DESC
    ;`, [article_id])
    .then(({rows}) => {
        if(rows.length === 0){
           return Promise.reject({
            status: 404,
            msg: "Not Found"
           });
        }
        return rows[0];
    });
};

exports.selectArticles = (topic, sort_by = "created_at", order = "DESC") => {
    const validSortBys = ["created_at", "author", "votes", "title", "topic"];
    const validOrders = ["DESC", "ASC", "desc", "asc"];

    const reqQueries = [];
    let queryStr = `
    SELECT COUNT(comments.article_id)::INT AS comment_count , articles.article_id, articles.title, articles.topic, articles.author, articles.created_at, articles.article_img_url, articles.votes
    FROM comments
    RIGHT JOIN articles 
    ON comments.article_id = articles.article_id`;

    if(topic){
        reqQueries.push(topic);
        queryStr += ` WHERE EXISTS (SELECT 1 FROM topics WHERE slug=$1) AND topic = $1`;
    }

    if(validSortBys.includes(sort_by) && validOrders.includes(order)){
        queryStr += `
        GROUP BY articles.article_id
        ORDER BY articles.${sort_by} ${order};`;  
    }
    else{
        return Promise.reject({
            status: 400,
            msg: "Bad Request"
           });
    }

    return db.query(queryStr, reqQueries)
    .then(({rows}) => {
        if(topic){
            return checkExists('topics', 'slug', topic)
            .then(() => {
            return rows;
            })
        }
        return rows;
    })
};

exports.selectCommentsByArticleId = (article_id) => {
    return db.query('SELECT * FROM comments WHERE article_id=$1 ORDER BY created_at DESC;', [article_id])
    .then(({rows}) => {
        return rows;
    });
};

exports.insertCommentByArticleId = (comment, article_id) => {
    const { username, body } = comment;
    if(typeof username !== "string" || typeof body !== "string"){
        return Promise.reject({
            status: 400,
            msg: "Bad Request"
           });
    }
    return db.query('INSERT INTO comments (author, body, article_id) VALUES ($1, $2, $3) RETURNING *;',
    [username, body, article_id])
    .then(({rows}) => {
        return rows[0];
    })
};

exports.updateArticleByArticleId = (inc_votes, article_id) => {
    if(!Number(article_id) || typeof inc_votes !== 'number'){
        return Promise.reject({
            status: 400,
            msg: "Bad Request"
           });
    }

    return db.query('UPDATE articles SET votes = votes + $1 WHERE article_id=$2 RETURNING *;'
    , [inc_votes, article_id])
    .then(({rows}) => {
        if(rows.length === 0){
            return Promise.reject({
                status: 404,
                msg: "Not Found"
               });
        }
        return rows[0];
    })
};

exports.deleteCommentByCommentId = (comment_id) => {
    return db.query('DELETE FROM comments WHERE comment_id=$1 RETURNING *;', [comment_id])
    .then(({rows}) => {
        if(rows.length === 0){
            return Promise.reject({
                status: 404,
                msg: "Not Found"
               });
        }
    });
};
