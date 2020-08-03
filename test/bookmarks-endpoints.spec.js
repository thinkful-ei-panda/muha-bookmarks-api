const knex = require('knex');

const app = require('../src/app.js');
const { makeBookmarksArray } = require('./bookmarks.fixtures');
const supertest = require('supertest');
const { expect } = require('chai');

describe('Bookmarks endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  before('clean table', () => db('bookmarks').truncate());

  afterEach('clean table', () => db('bookmarks').truncate());

  after('disconnect from db', () => db.destroy());

  describe('GET /bookmarks', () => {
    context('given no data', () => {
      it('returns 200 and empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, []);
      });
    });

    context('given data', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks);
      });
      
      it('respond 200 with all bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks);

      });
    });

  });

  describe('GET /bookmarks/:bookmark_id', () => {
    context('given no data', () => {
      it('responds with 404', () => {
        const id = 123456;
        return supertest(app)
          .get(`/bookmarks/${id}`)
          .expect(404, { error: 
            {message: `bookmark not found`}});
      });
    });

    context('given data', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db('bookmarks').insert(testBookmarks);
      });
      
      it('GET responds status 200 with a bookmark matching id', () => {
        const id = 2;
        const expected = testBookmarks[id - 1];

        return supertest(app)
          .get(`/bookmarks/${id}`)
          .expect(200, expected);
      });
    });

  });

  describe.only('POST /bookmarks', () => {
    it('creates a bookmark, respond 201 with new bookmark', () => {
      const newBookmark = {
        title: 'new test',
        url: 'bookmark.com',
        rating: 2,
        description: '',
      };

      

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id');
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then(postRes => {
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        })
    });

    const requiredFields = ['title', 'url', 'rating', 'description'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'new test',
        url: 'bookmark.com',
        rating: 2,
        description: null,
      };

      it(`responds 400 with error message when ${field} is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: {message: `missing ${field}`}
          })
      })
    });

    it('responds 400 with error message when rating is not between 1 and 5', () => {
      const newBookmark = {
        title: 'new test',
        url: 'bookmark.com',
        rating: 6,
        description: '',
      };

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(400, {
          error: {message: 'rating must be between 1 and 5'}
        })
    })

    it('responds with 400 and error message if title is blank', () => {
      const newBookmark = {
        title: '',
        url: 'bookmark.com',
        rating: 5,
        description: '',
      };

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(400, {
          error: {message: 'title cannot be blank'}
        })
    })

  });

  describe('DELETE /bookmarks/:id', () => {
    context('given data', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => db('bookmarks').insert(testBookmarks))
      
      it('responds 204 and deletes bookmark with matching id', () => {
        const id = 2;
        const expected = testBookmarks.filter(item => item.id !== id);

        return supertest(app)
          .delete(`/bookmarks/${id}`)
          .expect(204)
          .then(res => 
            supertest(app)
              .get('/bookmarks')
              .expect(expected)
          )
      })
    });

    context('given no data', () => {
      it('responds 404', () => {
        const id = 123456;

        return supertest(app)
          .delete(`/bookmarks/${id}`)
          .expect(404, {
            error: {message: 'bookmark not found'}
          })
      })
    })

  })

});