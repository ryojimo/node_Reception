/**
 * @fileoverview データクラスを定義したファイル
 * @author       Ryoji Morita
 * @version      0.0.1
*/

'use strict';

// 必要なライブラリをロード
var fs = require( 'fs' );
var MongoClient  = require( 'mongodb' ).MongoClient;


/**
 * データ class
 * @param {void}
 * @constructor
 * @example
 * var obj = new DataRoom();
*/
var DataRoom = function(){
  /**
   * MongoDB のデータベース名
   * @type {string}
  */
  this.nameDatabase = 'room';

  /**
   * MongoDB の URL
   * @type {string}
  */
  this.mongo_url = 'mongodb://localhost:27017/';

  /**
   * 入場者数カウンタ
   * @type {Object}
  */
  this.cnt = 0;
};


/**
 * 入場者数カウンタをクリアする
 * @param {void}
 * @return {void}
 * @example
 * Clear();
*/
DataRoom.prototype.Clear = function(){
  console.log( "[DataRoom.js] Clear()" );
  this.cnt = 0;
}


/**
 * 入場者数カウンタを更新する
 * @param {void}
 * @return {void}
 * @example
 * Update();
*/
DataRoom.prototype.Update = function(){
  console.log( "[DataRoom.js] Update()" );
  this.cnt++;
  console.log( "[DataRoom.js] cnt = " + this.cnt );
}


/**
 * 入場者数カウンタを取得する
 * @param {void}
 * @return {void}
 * @example
 * Update();
*/
DataRoom.prototype.Get = function(){
  console.log( "[DataRoom.js] Get()" );
  console.log( "[DataRoom.js] cnt = " + this.cnt );
  return this.cnt;
}


/**
 * Mongodb にデータベース、コレクション、ドキュメントを作成する。
 * @param {string} day - 日付。( MongoDB のコレクション名でも使用 )
 * @param {string} hour - 時間。
 * @param {number} cnt - 訪問者数カウンタ。
 * @return {void}
 * @example
 * CreateMDDoc( "2018-08-10", "08:00" );
*/
DataRoom.prototype.CreateMDDoc = function( day, hour ){
  console.log( "[DataRoom.js] CreateMDDoc()" );

  var doc = { hour: hour, cnt: this.cnt };

  MongoClient.connect( this.mongo_url, function(err, db) {
    if( err ){
      throw err;
    }

    // データベースを取得する
    var dbo = db.db( 'room' );

    // コレクションを取得する
    var clo = dbo.collection( day );

    // doc をデータベースに insert する
    clo.insertOne( doc, function(err, res) {
      if( err ){
        throw err;
      }
      db.close();
    });
  });
}


/**
 * 指定した日付の訪問者数情報を取得する。
 * @param {string} day - 対象の日付。( MongoDB のコレクション名でも使用 )
 * @param {function(boolean, Object.<string, number>)} callback - データを取得するためのコールバック関数
 * @return {void}
 * @example
 * GetMDDocDataOneDay( '2018-05-14',  );
*/
DataRoom.prototype.GetMDDocDataOneDay = function( day, callback ){
  console.log( "[DataRoom.js] GetMDDocDataOneDay()" );
  console.log( "[DataRoom.js] day    = " + day );

  var cname = day;  // コレクション名

  var data = { '00-00': 0, '01-00': 0, '02-00': 0, '03-00': 0, '04-00': 0, '05-00': 0,
               '06-00': 0, '07-00': 0, '08-00': 0, '09-00': 0, '10-00': 0, '11-00': 0,
               '12-00': 0, '13-00': 0, '14-00': 0, '15-00': 0, '16-00': 0, '17-00': 0,
               '18-00': 0, '19-00': 0, '20-00': 0, '21-00': 0, '22-00': 0, '23-00': 0
             };

  MongoClient.connect( this.mongo_url, function(err, db) {
    if( err ) throw err;

    // データベースを取得する
    var dbo = db.db( 'room' );

    // コレクションを取得する
    var clo = dbo.collection( cname );

    // コレクションに含まれるすべてのドキュメントを取得する
    clo.find({}).toArray( function(err, documents){
      try{
        if( err ){
          throw err;
        }

        var i = 0;
        var len = documents.length;
        console.log( "[DataRoom.js] len = " + len );

        for( i = 0; i < len; i++ ){
          var hour = documents[i].hour;

          hour = hour.replace( ':', '-' );    // hh:mm を hh-mm の形式に置換する

          data[ hour ] = documents[i].cnt;
        }
        db.close();

        console.log( "[DataRoom.js] data.length = " + data.length );
        var ret = false;
        if( len == 24 ){
          ret = true;
        }

//      console.log( data );
        callback( ret, data );
      }
      catch( e ){
        console.log( "[DataRoom.js] e = " + e );
        callback( false, data );
      }
    });
  });
}




/**
 * 引数の file からデータを読み出して dataOneDay プロパティを更新する。
 * @param {string} file - 対象のファイル ( フルパス )
 * @return {Object} ret - 読み出したデータ
 * @example
 * var obj = UpdateDataOneDay( '/media/pi/USBDATA/2018-01-23_room.txt' );
*/
DataRoom.prototype.UpdateDataOneDay = function( file ){
  console.log( "[DataRoom.js] UpdateDataOneDay()" );
  console.log( "[DataRoom.js] file = " + file );

  var date = file.replace( '/media/pi/USBDATA/', '' );
  date = date.replace( '_room.txt', '' );

  this.date = date;
  console.log( "[DataRoom.js] this.date = " + this.date );

  var ret = false;
  try{
    fs.statSync( file );
    var ret = fs.readFileSync( file, 'utf8');
    var obj = (new Function("return " + ret))();

    for( var key in this.dataOneDay ){
      this.dataOneDay[key] = obj[key];
    }
    console.log( '[DataRoom.js] this.dataOneDay = ' + JSON.stringify(this.dataOneDay) );
  } catch( err ){
    if( err.code === 'ENOENT' ){
      console.log( "[DataRoom.js] file does not exist." );
      for( var key in this.dataOneDay ){
        this.dataOneDay[key] = 0;
      }
      ret = false
    }
  }
  return ret;
};


/**
 * 引数の file の中身を更新する
 * @param {string} file - 対象のファイル ( フルパス )
 * @return {void}
 * @example
 * AppendFile( "/media/pi/USBDATA/2018-01-23_room.txt" );
*/
DataRoom.prototype.AppendFile = function( file ){
  console.log( "[DataRoom.js] AppendFile()" );
  console.log( "[DataRoom.js] file = " + file );


  var date = new Date();
  var hour = toDoubleDigits( date.getHours() );
  var str = '';

  if( hour == '00' ){
    str += '{';
  }

  // hour から -1 した時間を this.hour にセット
  this.hour = toDoubleDigits(hour - 1) + '-00';
  str += '"' + this.hour + '"' + ':' + this.cnt;

  if( hour == '23' ){
    str += '}';
  } else {
    str += ', ';
  }

  console.log( "[DataRoom.js] hour = " + hour );
  console.log( "[DataRoom.js] this.hour = " + this.hour );
  console.log( "[DataRoom.js] str = " + str );

  try{
    fs.appendFileSync( file, str, 'utf8' );
  } catch( err ){
    if( err.code === 'ENOENT' ){
      console.log( "[DataPerson.js] file does not exist." );
    }
  }

  this.cnt = 0;
}


/**
 * 数字が 1 桁の場合に 0 埋めで 2 桁にする
 * @param {number} num - 数値
 * @return {number} num - 0 埋めされた 2 桁の数値
 * @example
 * toDoubleDigits( 8 );
*/
var toDoubleDigits = function( num ){
  console.log( "[DataRoom.js] toDoubleDigits()" );
  console.log( "[DataRoom.js] num = " + num );
  num += '';
  if( num.length === 1 ){
    num = '0' + num;
  }
  return num;
};


module.exports = DataRoom;


