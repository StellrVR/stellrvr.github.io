module.exports = function(eleventyConfig) {
    const rssPlugin = require("@11ty/eleventy-plugin-rss");
    eleventyConfig.addPlugin(rssPlugin);

    eleventyConfig.addPassthroughCopy({"styles.css": "styles.css"});
    eleventyConfig.addPassthroughCopy({"script.js": "script.js"});
    eleventyConfig.addPassthroughCopy({"assets": "assets"});

    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/posts/**/*.md")
            .sort((a, b) => b.date - a.date);
    });

    eleventyConfig.addCollection("tagList", function(collection) {
        let tagSet = new Set();
        collection.getAll().forEach(item => {
            (item.data.tags || []).forEach(tag => tagSet.add(tag));
        });
        return [...tagSet].sort();
    });

    eleventyConfig.addFilter("readableDate", dateObj => {
        return new Date(dateObj).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });

    eleventyConfig.addFilter("filterByTag", function(posts, tag) {
        return posts.filter(post => (post.data.tags || []).includes(tag));
    });

    return {
        dir: {
            input: "src",
            output: "blog",
            includes: "_includes"
        },
        // pathPrefix: "/blog/",  ← REMOVE THIS LINE
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk"
    };
};