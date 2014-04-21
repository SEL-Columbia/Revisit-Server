module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    express: {
	  options: {
	    // Override defaults here
	  },
	  dev: {
	    options: {
	      script: 'server.js'
	    }
	  }
	},
	watch: {
		express: {
			files: [ 'server.js' ],
			tasks: ['express:dev'],
			options: {
				spawn: false
			}
		}
	}
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');


  grunt.registerTask('server', [ 'express:dev', 'watch' ]);

};