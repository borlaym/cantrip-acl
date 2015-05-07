/*global module:false*/
module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        nodemon: {
            dev: {
                script: 'examples/server.js',
                options: {
                    watch: ['index.js', 'examples/**/*.js']
                }
            }
        },
        mochaTest: {
            test: {
                options: {
                  reporter: 'spec',
                  quiet: false, // Optionally suppress output to standard out (defaults to false)
                  clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['tests/tests/**/*.js']
              }
        },
        watch: {
            scripts: {
                files: ["index.js", "lib/dataStore.js", "tests/**/*.js"],
                tasks: ["mochaTest"]
            }
        }
    });

    //console.log(grunt.option.flags());

    grunt.registerTask('server', ["nodemon"]);
    grunt.registerTask('test', ["mochaTest"]);
    grunt.registerTask('testserver', ["mochaTest", "watch"])

};