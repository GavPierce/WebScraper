import Fuse from 'fuse.js'


export function fuzzySearch(query: any, collection: any[]) {
    const options = {
        includeScore: true,
        // Search in `author` and in `tags` array
        keys: ['Description']
      }
      
      const fuse = new Fuse(collection, options)
      
      const result = fuse.search(query);

      return result;
}
  
  