const express = require('express');
const xss = require('xss');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const BookmarksService = require('./bookmarks-service');

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const db = req.app.get('db');
    BookmarksService.getAllBookmarks(db)
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, rating, description} = req.body;
    const newBookmark = { title, url, rating, description };
    
    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: {message: `missing ${key}`}
        })
      }
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: {message: 'rating must be between 1 and 5'}
      })
    }

    if (title === '') {
      return res.status(400).json({
        error: {message: 'title cannot be blank'}
      })
    }

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json({
            id: bookmark.id,
            title: xss(bookmark.title),
            url: xss(bookmark.url),
            rating: xss(bookmark.rating),
            description: xss(bookmark.description),
          })
      })
      .catch(next)
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    const db = req.app.get('db');
    
    BookmarksService.getById(db, req.params.id)
      .then(bookmark => {
        if(!bookmark) {
          return res.status(404).json({
            error: {message: 'bookmark not found'}
          })
        }
        res.bookmark = bookmark;
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json({
      id: res.bookmark.id,
      title: xss(res.bookmark.title),
      url: xss(res.bookmark.url),
      rating: xss(res.bookmark.rating),
      description: xss(res.bookmark.description),
    })
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(req.app.get('db'), req.params.id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })


module.exports = bookmarksRouter;