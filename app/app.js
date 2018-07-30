/**
 * @fileoverview アプリケーション UI
 * @author       Ryoji Morita
 * @version      0.0.1
*/
var sv_ip   = "reception.rp.lfx.sony.co.jp";  // node.js server の IP アドレス
//var sv_ip   = "43.31.78.45";                // node.js server の IP アドレス
//var sv_ip   = "192.168.91.123";             // node.js server の IP アドレス
var sv_port = 4000;                           // node.js server の port 番号

var server = io.connect( "http://" + sv_ip + ":" + sv_port ); //ローカル


//-----------------------------------------------------------------------------
// ブラウザオブジェクトから受け取るイベント
window.onload = function(){
  console.log( "[app.js] window.onloaded" );
};


window.onunload = function(){
  console.log( "[app.js] window.onunloaded" );
};


//-----------------------------------------------------------------------------
// サーバから受け取るイベント
server.on( 'connect', function(){               // 接続時
  console.log( "[app.js] " + 'connected' );
});


server.on( 'disconnect', function( client ){    // 切断時
  console.log( "[app.js] " + 'disconnected' );
});


var g_cmnt = "";


server.on( 'S_to_C_TIME', function( data ){
  console.log( "[app.js] " + 'S_to_C_TIME' );
  console.log( "[app.js] data = " + data.value );
  resetMonitor();
});


server.on( 'S_to_C_DATA', function( data ){
  console.log( "[app.js] " + 'S_to_C_DATA' );
  console.log( "[app.js] data = " + data.gid + ", " + data.name + ", " + data.cnt );
  console.log( "[app.js] date = " + data.lastVisitDay.substr(8, 2) );
//  var obj = (new Function("return " + data))();

  // Special Name
  var name = [
              { gid:"0000900576", name:"中田先生",     postfix:"さん" }, // 中田 充
              { gid:"0000920698", name:"本村パパ",     postfix:"さん" }, // 本村 謙介
              { gid:"0000931034", name:"金子店長",     postfix:"さん" }, // 金子 孝幸
              { gid:"0000108215", name:"福馬工房長",   postfix:"さん" }, // 福馬 洋平
              { gid:"0000114347", name:"マイロード",   postfix:""     }, // 森田 良二
              { gid:"0000134706", name:"ぼす",         postfix:"さん" }, // 林 哲也
              { gid:"0000139082", name:"鈴木副工房長", postfix:"さん" }, // 鈴木 龍一
              { gid:"0000139174", name:"のぶし",       postfix:"さん" }  // 山本 崇晴
             ];

  // data.gid が name テーブルにあれば data.name を変える
  var postfix = "さん";
  for( i = 0; i < name.length; i++ ){
    if( name[i].gid == data.gid ){
      data.name = name[i].name;
      postfix   = name[i].postfix;
    }
  }

  document.getElementById("val_prefix" ).innerHTML = "ようこそ";
  document.getElementById("val_name"   ).innerHTML = data.name;   // 名前を表示
  document.getElementById("val_time"   ).innerHTML = "";          // 時刻表示をクリア
  document.getElementById("val_postfix").innerHTML = postfix;     // postfix を表示

  // しゃべる
  // data.name を苗字と "さん" の形にする
  var lastname = data.name.split( ' ' );
  data.name = lastname[0] + postfix;
  talk( data );
});


//-------------------------------------
/**
 * しゃべる
 * @param {object} data - { gid:"", name:"", cnt:1, lastVisitDay:"" } 形式のオブジェクト
 * @return {void}
 * @example
 * talk();
*/
function talk( data ){
  console.log( "[app.js] talk()" );

  // コメントをセットする
  setCmnt( data );

  // 2sec 後にあいさつをしゃべる
  setTimeout( "sendTalkHello()", 2000 );

  // 10sec 後に表示をリセット
  setTimeout( "resetMonitor()", 10000 );
}


/**
 * コメントを g_cmnt にセットする
 * @param {object} data - { gid:"", name:"", cnt:1, lastVisitDay:"" } 形式のオブジェクト
 * @return {void}
 * @example
 * talk();
*/
function setCmnt( data ){
  console.log( "[app.js] setCmnt()" );
  console.log( "[app.js] data.name         = " + data.name );
  console.log( "[app.js] data.lastVisitDay = " + data.lastVisitDay );

  // "○○さん" を g_cmnt にセット
  g_cmnt = data.name;

  // 日付をチェックしてコメントを g_cmnt にセット
  var date = new Date();

  var day_flag = parseInt( data.lastVisitDay.substr(8, 2) );
  console.log( "[app.js] date.getDate() = " + date.getDate() );
  console.log( "[app.js] day_flag       = " + day_flag );

  var num = date.getDate() - day_flag;
  if( day_flag !== NaN && num > 3 ){
    g_cmnt += "、" + num + "日ぶりですね。";
  } else {
    g_cmnt += "、" + "ご意見、ご要望はこの裏のアンケートへおねがいします。";
  }

  console.log( "[app.js] g_cmnt = " + g_cmnt );
}


/**
 * モニタ表示をデフォルト状態にリセットする
 * @param {void}
 * @return {void}
 * @example
 * resetMonitor();
*/
function resetMonitor(){
  console.log( "[app.js] resetMonitor()" );

  var date = new Date();
  var yobi = new Array( "日", "月", "火", "水", "木", "金", "土" );

  var month = toDoubleDigits( date.getMonth() + 1 );
  var day   = toDoubleDigits( date.getDate() );
  var week  = date.getDay();
  var time  = toDoubleDigits( date.getHours() ) + ":" + toDoubleDigits( date.getMinutes() );

  document.getElementById("val_prefix" ).innerHTML = month + "/" + day + "(" + yobi[week] + ")";
  document.getElementById("val_name"   ).innerHTML = "";    // 名前を表示
  document.getElementById("val_time"   ).innerHTML = time;  // 時間を表示
  document.getElementById("val_postfix").innerHTML = "";    // postfix を表示
}


/**
 * 数字が 1 桁の場合に 0 埋めで 2 桁にする
 * @param {number} num - 数値
 * @return {number} num - 0 埋めされた 2 桁の数値
 * @example
 * toDoubleDigits( 8 );
*/
var toDoubleDigits = function( num ){
  console.log( "[app.js] toDoubleDigits()" );
  console.log( "[app.js] num = " + num );
  num += "";
  if( num.length === 1 ){
    num = "0" + num;
  }
  return num;
};


//-----------------------------------------------------------------------------
// ドキュメント・オブジェクトから受け取るイベント


//-----------------------------------------------------------------------------
/**
 * Set コマンドを送る。
 * @param {string} cmd - コマンドの文字列
 * @return {void}
 * @example
 * sendSetCmd( 'sudo ./board.out usbkey 0x3E' );
*/
function sendSetCmd( cmd ){
  console.log( "[app.js] sendSetCmd()" );
  console.log( "[app.js] cmd = " + cmd );

  console.log( "[app.js] server.emit(" + 'C_to_S_SET' + ")" );
  server.emit( 'C_to_S_SET', cmd );
}


/**
 * しゃべる、あいさつのデータを送る。
 * @param {void}
 * @return {void}
 * @example
 * sendTalkHello();
*/
function sendTalkHello(){
  console.log( "[app.js] sendTalkHello()" );

  var prefix = ["ようこそ",
                "こんにちわ",
                "いらっしゃいませ",
                "ご利用ありがとうございます",
                "畳の上に椅子を置くときは足あとが残らないものを選んでね"
               ];

  var no = Math.floor( Math.random() * prefix.length );
  var hi = prefix[ no ];
  console.log( "[app.js] hi = " + hi );

  console.log( "[app.js] server.emit(" + 'C_to_S_TALK_HELLO' + ")" );
  server.emit( 'C_to_S_TALK_HELLO', hi + g_cmnt );

  // g_cmnt をクリア
  g_cmnt = "";
}


