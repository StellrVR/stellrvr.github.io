module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("styles.css");
    eleventyConfig.addPassthroughCopy("script.js");
    eleventyConfig.addPassthroughCopy("assets");

    eleventyConfig.addFilter("readableDate", (dateObj) => {
        return new Date(dateObj).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    });

    eleventyConfig.addFilter("excerpt", (content) => {
        const excerpt = content.substring(0, 200);
        return excerpt + (content.length > 200 ? '...' : '');
    });

    return {
        dir: {
            input: "blog",
            output: "_site/blog",
            includes: "_includes"
        },
        templateFormats: ["md", "njk", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk"
    };
};