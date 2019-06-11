'use strict'

const gulp = require('gulp')
const scp = require('gulp-scp2');
const shell = require('gulp-shell')
const connect = require('gulp-connect')
 
// 开启本地服务器
gulp.task('dev',function(){
  connect.server({
    // 设置根目录
    root:'./_book',
    port:8090,
    // 启动实时刷新
    livereload:true
  })
})

gulp.task('build',()=>{
    return gulp.src('./ios.tar')
    .pipe(scp({
      host: '101.132.180.168',
      username: 'root',
      password: 'Huang147',
      dest: '/usr/local/nginx/'
    }))
    .on('error', function(err) {
      console.log(err);
    });
})

gulp.task('default',['build'],function(){
    console.log('打包生成完毕')
})