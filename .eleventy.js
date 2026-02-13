module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy({"styles.css": "styles.css"});
    eleventyConfig.addPassthroughCopy({"script.js": "script.js"});
    eleventyConfig.addPassthroughCopy({"assets": "assets"});

    eleventyConfig.addFilter("readableDate", (dateObj) => {
        return new Date(dateObj).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });

    eleventyConfig.addFilter("excerpt", (content) => {
        const excerpt = content.substring(0, 200);
        return excerpt + (content.length > 200 ? '...' : '');
    });

    return {
        dir: {
            input: "src",
            output: "blog",
            includes: "_includes"
        },
        templateFormats: ["md", "njk", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk"
    };
};