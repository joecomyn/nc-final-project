const app = require('../app');
const request = require('supertest');
const db = require("../db/connection");
const data = require('../db/data/test-data');
const seed = require('../db/seeds/seed');
const endpointsCheck = require('../endpoints.json');

beforeEach(() => seed(data));
afterAll(() => db.end());

describe('GET', () => {

    describe('GET: /api/topics', () => {

        describe('GOOD PATH:', () => {

            test('200: /api/topics responds with an array of topic objects: each having a description and aslug property', () => {
                return request(app)
                .get('/api/topics')
                .expect(200)
                .then(({body: { topics }}) => {
                    topics.forEach((topic) => {
                        expect(typeof topic.description).toBe("string");
                        expect(typeof topic.slug).toBe("string");
                    })
                });
            });

        });


    });

    describe('GET: /api/users', () => {

        describe('GOOD PATH:', () => {

            test("200: when api path is used it returns an array of all users objects containing username, name and avatar_url", () => {
                return request(app)
                .get('/api/users')
                .expect(200)
                .then(({body: { users }}) => {
                    expect(users.length).toBe(4);
                    users.forEach((user) => {
                        expect(typeof user.username).toBe("string");
                        expect(typeof user.name).toBe("string");
                        expect(typeof user.avatar_url).toBe("string");
                    })
                });
            });

        });

    });

    describe('GET: /api/users/:username', () => {

        describe('GOOD PATH:', () => {

            test("200: GET:/api/users/:username should return the user object corresponding to the given username", () => {
                return request(app)
                .get('/api/users/butter_bridge')
                .expect(200)
                .then(({body: { user }}) => {
                    expect(user.username).toBe("butter_bridge");
                    expect(user.name).toBe("jonny");
                    expect(user.avatar_url).toBe("https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg");
                    
                });
            });

        });
    
        describe('BAD PATHS:', () => {

            test("404 GET:/api/users/:username when called with a non existing username should return 404 not found", () => {

                return request(app)
                .get('/api/users/not_a_username')
                .expect(404)
                .then(({body: {msg}}) => {
                    expect(msg).toBe('Not Found');
                })
            });

        });

    });

    describe('GET: /api', () => {

        describe('GOOD PATH:', () => {

            test(`200: /api responds with an object containing all available endpoints in this API.
            each endpoint key should have a object property which contains endpoint desccription,
            any queries the enddpoint takes, and an example response`, () => {
                return request(app)
                .get('/api')
                .expect(200)
                .then(({body: { endpoints }}) => {
                    expect(typeof endpoints).toBe('object');
                    expect(Array.isArray(endpoints)).toBe(false);
                    expect(endpoints !== null).toBe(true);
                    for(const receivedEndpoint in endpoints){
                        if(receivedEndpoint === "GET /api"){
                            expect(endpoints[receivedEndpoint].description).toBe("serves up a json representation of all the available endpoints of the api");
                        }else{
                            expect(endpoints[receivedEndpoint].description).toBe(endpointsCheck[receivedEndpoint].description);
                            expect(endpoints[receivedEndpoint].queries).toEqual(endpointsCheck[receivedEndpoint].queries);
                            expect(endpoints[receivedEndpoint].exampleResponse).toEqual(endpointsCheck[receivedEndpoint].exampleResponse);
                        }
                    }
                });
            });

        });


    });

    describe('GET: /api/articles/:article_id', () => {

        describe('GOOD PATH:', () => {

            test(`200: /api/topics responds with an article object containing all 
            row properties of an article: (article_id, title, topic, author, body, time created, 
            and image url)`, () => {
                return request(app)
                .get('/api/articles/1')
                .expect(200)
                .then(({body: { article }}) => {
                    expect(article.article_id).toBe(1);
                    expect(article.title).toBe("Living in the shadow of a great man");
                    expect(article.topic).toBe("mitch");
                    expect(article.author).toBe("butter_bridge");
                    expect(article.body).toBe("I find this existence challenging");
                    expect(article.created_at).toBe("2020-07-09T20:11:00.000Z");
                    expect(article.article_img_url).toBe("https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700");
                    expect(article.comment_count).toBe(11);
                });

            });

        });

        describe('BAD PATHS:', () => {
            
            test('404: /api/articles/9999 When passed a non-existing id send a 404 Not found', () => {
                return request(app)
                .get('/api/articles/9999')
                .expect(404)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Not Found");
                });
            });

            test('400: /api/articles/not_an_id When passed an id that is not the correct format send a 400 bad request', () => {
                return request(app)
                .get('/api/articles/not_an_id')
                .expect(400)
                .then(({body: { msg }}) => {
                    expect(msg).toBe('Bad Request');
                });
            });

        });

    });

    describe('GET: /api/articles', () => {

        describe('GOOD PATHS:', () => {

            test(`200: /api/articles responds with an array of article objects: 
            each having author, title, article_id, topic, created_at, votes, 
            article_img_url, comment_count properties`, () => {
                return request(app)
                .get('/api/articles')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(articles.length).toBe(13);
                    articles.forEach((article) => {
                        expect(article).not.toHaveProperty('body');
                        expect(typeof article.author).toBe("string");
                        expect(typeof article.title).toBe("string");
                        expect(typeof article.article_id).toBe("number");
                        expect(typeof article.topic).toBe("string");
                        expect(typeof article.created_at).toBe("string");
                        expect(typeof article.votes).toBe("number");
                        expect(typeof article.article_img_url).toBe("string");
                        expect(typeof article.comment_count).toBe("number");
                    })
                });
            });

            test(`200: return array of articles in DESCENDING order`, () => {
                return request(app)
                .get('/api/articles')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(articles).toBeSortedBy('created_at', { descending: true });
                });
            });

            test(`200: GET:/api/articles/?topic=mitch get all articles under the mitch topic with all their previously mentioned properties `, () => {
                return request(app)
                .get('/api/articles/?topic=mitch')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(articles.length).toBe(12);
                    articles.forEach((article) => {
                        expect(article).not.toHaveProperty('body');
                        expect(typeof article.author).toBe("string");
                        expect(typeof article.title).toBe("string");
                        expect(typeof article.article_id).toBe("number");
                        expect(article.topic).toBe("mitch");
                        expect(typeof article.created_at).toBe("string");
                        expect(typeof article.votes).toBe("number");
                        expect(typeof article.article_img_url).toBe("string");
                        expect(typeof article.comment_count).toBe("number");
                    })
                });
            });

            test(`200: GET:/api/articles/?topic=paper when given an existing topic that has no articles under it return an empty array`, () => {
                return request(app)
                .get('/api/articles/?topic=paper')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(Array.isArray(articles)).toBe(true);
                    expect(articles.length).toBe(0)
                });
            });

            test(`200: GET:/api/articles/?sort_by=author when given a valid sort_by query sort the table by that column and by the default desc`, () => {
                return request(app)
                .get('/api/articles/?sort_by=author')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(articles).toBeSortedBy('author', { descending: true });
                });
            });

            test(`200: GET:/api/articles/?order=asc when given a valid order by query order by the default created_at column and the given order pattern`, () => {
                return request(app)
                .get('/api/articles/?order=asc')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(articles).toBeSortedBy('created_at', { descending: false });
                });
            });

            test(`200: GET:/api/articles/?topic=mitch&sort_by=votes&order=asc when given an aggregate query be able to return an array sorted and ordered by the queries specifications`, () => {
                return request(app)
                .get('/api/articles/?topic=mitch&sort_by=votes&order=asc')
                .expect(200)
                .then(({body: { articles }}) => {
                    expect(articles).toBeSortedBy('votes', { descending: false });
                    articles.forEach((article) => {
                        expect(article.topic).toBe("mitch");
                    });
                });
            });
        });

        describe('BAD PATHS:', () => {

            test('404: GET:/api/articles/?topic=not_a_topic When passed a topic query of a non-existing topic send a 404 Not found', () => {
                return request(app)
                .get('/api/articles/?topic=not_a_topic')
                .expect(404)
                .then(({body: { msg}}) => {
                    expect(msg).toBe("Not Found");
                });
            });
            
            test('400: GET:/api/articles/?sort_by=not_a_valid_sort when passed an invalid sort_by query return 400 bad request', () => {
                return request(app)
                .get('/api/articles/?sort_by=not_a_valid_sort')
                .expect(400)
                .then(({body: { msg}}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test('400: GET:/api/articles/?order=not_an_order When passed an invalid order by pattern return 400 bad request', () => {
                return request(app)
                .get('/api/articles/?order=not_an_order')
                .expect(400)
                .then(({body: { msg}}) => {
                    expect(msg).toBe("Bad Request");
                });
            });
        });

    });

    describe('GET: /api/articles/:article_id/comments', () => {

        describe('GOOD PATH:', () => {

            test(`200: /api/articles/:article_id/comments responds with an array of comment objects: 
            each having comment_id, votes, created_at, author, body and article_id properties`, () => {
                return request(app)
                .get('/api/articles/1/comments')
                .expect(200)
                .then(({body: { comments }}) => {
                    expect(comments.length).toBe(11);
                    comments.forEach((comment) => {
                        expect(typeof comment.comment_id).toBe("number");
                        expect(typeof comment.votes).toBe("number");
                        expect(typeof comment.created_at).toBe("string");
                        expect(typeof comment.author).toBe("string");
                        expect(typeof comment.body).toBe("string");
                        expect(comment.article_id).toBe(1);
                    })
                });
            });

            test(`200: When passed an article_id return array of comments associated with that article_id in DESCENDING order`, () => {
                return request(app)
                .get('/api/articles/4/comments')
                .expect(200)
                .then(({body: { comments }}) => {
                    expect(comments).toBeSortedBy('created_at', { descending: true });
                });
            });

            test(`200: When passed an article_id that corresponds to an article with no comments return an empty array`, () => {
                return request(app)
                .get('/api/articles/4/comments')
                .expect(200)
                .then(({body: { comments }}) => {
                   expect(comments.length).toBe(0);
                });
            });

        });

        describe('BAD PATHS:', () => {

            test(`404: When passed an article_id that does not exist but fits the correct variable type respond with a 404: Not Found error`, () => {
                return request(app)
                .get('/api/articles/9999/comments')
                .expect(404)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Not Found");
                });
            });

            test(`400: When passed an article_id that is not the correct format/variable type respond with a 400: Bad Request`, () => {
                return request(app)
                .get('/api/articles/not_an_id/comments')
                .expect(400)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

        });
    });

});

describe('POST', () => {

    describe('POST: /api/articles/:article_id/comments', () => {

        describe('GOOD PATHS:', () => {
            
            test('201: when passed a username and comment body on a correct article_id post the new comment to that article and return the posted comment', () => {

                const inputComment = {
                    username: "icellusedkars",
                    body: "I like eggs"
                }

                return request(app)
                .post('/api/articles/4/comments')
                .send(inputComment)
                .expect(201)
                .then(({body: { postedComment }}) => {
                    expect(typeof postedComment.comment_id).toBe('number');
                    expect(postedComment.body).toBe(inputComment.body);
                    expect(postedComment.author).toBe(inputComment.username);
                    expect(postedComment.article_id).toBe(4);
                    expect(postedComment.votes).toBe(0);
                    expect(typeof postedComment.created_at).toBe('string')
                });
            });

            test('201: when passed a username and comment body with extra unnecessary values on a correct article_id post the new comment without other values to that article and return the posted comment', () => {

                const inputComment = {
                    username: "icellusedkars",
                    body: "I like eggs",
                    test1: "not needed",
                    test2: "not needed either"
                }

                return request(app)
                .post('/api/articles/4/comments')
                .send(inputComment)
                .expect(201)
                .then(({body: { postedComment }}) => {
                    expect(Object.keys(postedComment).length).toBe(6);
                    expect(typeof postedComment.comment_id).toBe('number');
                    expect(postedComment.body).toBe(inputComment.body);
                    expect(postedComment.author).toBe(inputComment.username);
                    expect(postedComment.article_id).toBe(4);
                    expect(postedComment.votes).toBe(0);
                    expect(typeof postedComment.created_at).toBe('string')
                });
            });

        });

        describe('BAD PATHS:', () => {

            test(`404: When passed an article_id that does not exist but fits the correct variable type respond with a 404: Not Found error`, () => {

                const inputComment = {
                    username: "icellusedkars",
                    body: "I like eggs"
                };

                return request(app)
                .post('/api/articles/9999/comments')
                .expect(404)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Not Found");
                });
            });

            test(`400: When trying to post a comment to an article_id that does not fit format send 400: Bad Request`, () => {

                const inputComment = {
                    username: "icellusedkars",
                    body: "I like eggs"
                };

                return request(app)
                .post('/api/articles/not_an_id/comments')
                .expect(400)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test(`400: When trying to post a comment that is missing body property respond with a 400 bad request`, () => {

                const inputComment = {
                    username: "icellusedkars"
                };

                return request(app)
                .post('/api/articles/4/comments')
                .expect(400)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test(`400: When trying to post a comment that has a username which doesnt fit format send a 400: Bad Request`, () => {

                const inputComment = {
                    username: 2939049,
                    body: "hello"
                };

                return request(app)
                .post('/api/articles/4/comments')
                .expect(400)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test(`400: When trying to post a comment that has a body which doesnt fit format send a 400: Bad Request`, () => {

                const inputComment = {
                    username: "icellusedkars",
                    body: 584857494
                };

                return request(app)
                .post('/api/articles/4/comments')
                .expect(400)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test(`400: When trying to post a comment that is missing username property respond with a 400 bad request`, () => {

                const inputComment = {
                    body: "I like eggs"
                };

                return request(app)
                .post('/api/articles/4/comments')
                .expect(400)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test(`400: When posted an empty comment object respond with 400: Bad Request`, () => {

                const inputComment = {};

                return request(app)
                .post('/api/articles/4/comments')
                .expect(400)
                .send(inputComment)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });
            });

            test(`404: When trying to post a comment with a username that fits format but doesnt exist in the database respond with 404: username not found`, () => {

                const inputComment = {
                    username: "not_a_username",
                    body: "Hey guys whatsup"
                };

                return request(app)
                .post('/api/articles/4/comments')
                .expect(404)
                .send(inputComment)
                .then(({body: { patchedItem }}) => {
                    
                });
            });

        });

    });

});

describe('PATCH', () => {

    describe('PATCH: /api/articles/:article_id', () => {

        describe('GOOD PATHS:', () => {
            
            test('200: { inc_votes: newvotes } object on a correct article_id, update existing article that has corresponding article_id with the votes returning the patched article with the updated votes value', () => {
                const patchItem = { inc_votes: 1 };

                return request(app)
                .patch('/api/articles/4')
                .send(patchItem)
                .expect(200)
                .then(({body: { patchedArticle }}) => {
                    expect(patchedArticle.votes).toBe(1);
                });
            });
            
            test('200: negative vote values should be able to be taken to emulate downvotes', () => {
                const patchItem = { inc_votes: -100 };

                return request(app)
                .patch('/api/articles/4')
                .send(patchItem)
                .expect(200)
                .then(({body: { patchedArticle }}) => {
                    expect(patchedArticle.votes).toBe(-100);
                });

            });

            test('200: when patch is called with a valid article_id, make sure no other article values can be changed or added other than votes being incrememented', () => {
                const patchItem = { 
                    inc_votes: 1, 
                    body: "Don't change the body" ,
                    newProperty: "Don't add this property"
                };

                return request(app)
                .patch('/api/articles/4')
                .send(patchItem)
                .expect(200)
                .then(({body: { patchedArticle }}) => {
                    expect(Object.keys(patchedArticle).length).toBe(8)
                    expect(patchedArticle.author).toBe("rogersop");
                    expect(patchedArticle.title).toBe("Student SUES Mitch!");
                    expect(patchedArticle.article_id).toBe(4);
                    expect(patchedArticle.topic).toBe("mitch");
                    expect(patchedArticle.created_at).toBe("2020-05-06T01:14:00.000Z");
                    expect(patchedArticle.votes).toBe(1);
                    expect(patchedArticle.article_img_url).toBe("https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700");
                });

            });

        });

        describe('BAD PATHS:', () => {

            test(`404: When trying to patch votes on an article that doesnt exist throw 404`, () => {

                const patchItem = {
                    inc_votes: 2
                };

                return request(app)
                .patch('/api/articles/9999')
                .expect(404)
                .send(patchItem)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Not Found");
                });

            });

            test(`400: if trying to increment votes on a article_id which doesnt fit format throw a 400 bad request`, () => {

                const patchItem = {
                    inc_votes: 3
                };

                return request(app)
                .patch('/api/articles/not_an_id')
                .expect(400)
                .send(patchItem)
                .then(({body: { msg }}) => {
                    expect(msg).toBe("Bad Request");
                });

            });

            test(`400: If votes to increment is not correct format throw bad request `, () => {

                const patchItem = {
                    inc_votes: "not_a_number"
                };

                return request(app)
                .patch('/api/articles/4')
                .expect(400)
                .send(patchItem)
                .then(({body: { deletedComment }}) => {
                    
                });

            });

        });

    });

});

describe('DELETE', () => {

    describe('DELETE: /api/comments/:comment_id', () => {
        
        describe('GOOD PATHS:', () => {

            test('204: When given a valid comment_id delete that comment and return no content',() => {

                return request(app)
                    .delete('/api/comments/1')
                    .expect(204)
                    .then(({body}) => {
                        expect(body).toEqual({});
                    })
            });

        });

        describe('BAD PATHS:', () => {

            test(`400: when trying to delete a comment with a comment_id that doesnt fit format throw 400 bad request`, () => {

                return request(app)
                .delete('/api/comments/ddhdh8dwh')
                .expect(400)
                .then(({body: {msg}}) => {
                    expect(msg).toBe("Bad Request");
                });

            });

        });

        describe('BAD PATHS:', () => {

            test(`404: when trying to delete a comment with a comment_id that fits format but doesnt exist throw 404`, () => {

                return request(app)
                .delete('/api/comments/9999')
                .expect(404)
                .then(({body: {msg}}) => {
                    expect(msg).toBe("Not Found");
                });

            });

        });
    });

});
describe('URL BAD PATHS:', () => {

    test('404: /api/topic responds with a 404 not found error as that endpoint does not exist', () => {
        return request(app)
        .get('/api/topic')
        .expect(404)
        .then(({body: { msg }}) => {
            expect(msg).toBe("Not found: Path doesnt exist"); 
        });
    });

});