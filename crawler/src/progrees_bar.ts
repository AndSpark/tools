import { stdout } from 'single-line-log'
import * as clc from 'cli-color'
interface Opts {
	completed: number
	total: number
	errors: number
	other:string
}


function ProgressBar(description, bar_length){
  // 两个基本参数(属性)
  this.description = description || 'Progress';       // 命令行开头的文字信息
  this.length = bar_length || 25;                     // 进度条的长度(单位：字符)，默认设为 25
 
  // 刷新进度条图案、文字的方法
  this.render = function (opts:Opts){
		var percent = Number((opts.completed / opts.total).toFixed(4));    // 计算进度(子任务的 完成数 除以 总数)
		var errorPercent = Number((opts.errors / opts.total).toFixed(4))
    var cell_num = Math.floor(percent * this.length);             // 计算需要多少个 █ 符号来拼凑图案
		var error_num = Math.floor(errorPercent * this.length); 
    // 拼接黑色条
    var cell = '';
    for (var i=0;i<cell_num;i++) {
      cell += '█';
    }
 
    // 拼接灰色条
    var empty = '';
    for (var i=0;i<this.length-cell_num-error_num;i++) {
      empty += '░';
    }
		
		// 拼接红色条
		var errors = ''
		for (var i=0;i<error_num;i++) {
      errors += clc.red('█');
		}
		
		var now = opts.completed + opts.errors

    // 拼接最终文本
    var cmdText = this.description + ': ' + (100*percent).toFixed(2) + '% ' + cell + errors + empty + ' ' + now + '/' + opts.total + ' ' + opts.other;
    
    // 在单行输出文本
    stdout(cmdText);
  };
}

export default ProgressBar