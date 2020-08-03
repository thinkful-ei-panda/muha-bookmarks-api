const BookmarksService = {
  getAllBookmarks(db) {
    return db('bookmarks').select()
  },
  getById(db, id) {
    return db('bookmarks').where({id}).first()
  },
  insertBookmark(db, newBookmark) {
    return db('bookmarks').insert(newBookmark).returning('*').then(rows => rows[0])
  },
  deleteBookmark(db, id) {
    return db('bookmarks').where({id}).delete()
  }
}

module.exports = BookmarksService;