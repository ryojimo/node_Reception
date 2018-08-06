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
 * var obj = new DataPersons();
*/
var DataPersons = function(){
  /**
   * MongoDB のデータベース名
   * @type {string}
  */
  this.nameDatabase = 'persons';

  /**
   * MongoDB の URL
   * @type {string}
  */
  this.mongo_url = 'mongodb://localhost:27017/';

  /**
   * データ
   * @type {Object}
  */
  this.data = { gid:'', name:'', cnt:0, lastVisitDay:'' };
};


/**
 * Mongodb にデータベース、コレクション、ドキュメントを作成する。
 * @param {Object.<string, string>} data - JSON 文字列
 * @return {void}
 * @example
 * CreateMDDoc( "{...}" );
*/
DataPersons.prototype.CreateMDDoc = function( data ){
  console.log( "[DataPersons.js] CreateMDDoc()" );
  console.log( "[DataPersons.js] data = " + JSON.stringify(data) );

  MongoClient.connect( this.mongo_url, function(err, db) {
    if( err ){
      throw err;
    }

    // データベースを取得する
    var dbo = db.db( 'persons' );

    // コレクションを取得する
    var clo = dbo.collection( 'visitor' );

    // doc をデータベースに insert する
    clo.insertOne( data, function(err, res) {
      if( err ){
        throw err;
      }
      db.close();
    });
  });
}


/**
 * Mongodb にデータベース、コレクション、ドキュメントを更新する。
 * @param {Object.<string, string>} data - JSON 文字列
 * @return {void}
 * @example
 * CreateMDDoc( "{...}" );
*/
DataPersons.prototype.UpdateMDDoc = function( data ){
  console.log( "[DataPersons.js] UpdateMDDoc()" );
  console.log( "[DataPersons.js] data = " + JSON.stringify(data) );

  MongoClient.connect( this.mongo_url, function(err, db) {
    if( err ){
      throw err;
    }

    // データベースを取得する
    var dbo = db.db( 'persons' );

    // コレクションを取得する
    var clo = dbo.collection( 'visitor' );

    var query = { gid: data.gid };
    var newvalues = { $set: {cnt: data.cnt, lastVisitDay: data.lastVisitDay } };

    // doc をデータベースに insert する
    clo.updateOne( query, newvalues, function(err, res) {
      if( err ){
        throw err;
      }
      db.close();
    });
  });
}


/**
 * コレクションに含まれる全ドキュメントを取得する
 * @param {string} gid   - MongoDB のコレクション。
 * @param {string} name  - 対象の名前。
 * @param {obj} callback - データを取得するためのコールバック関数
 * @return {void}
 * @example
 * GetMDDocData( '0000114347' );
*/
DataPersons.prototype.GetMDDocData = function( data, callback ){
  console.log( "[DataPersons.js] GetMDDocData()" );
  console.log( "[DataPersons.js] data = " + JSON.stringify(data) );

//  var data = { gid: data.gid, name: data.name, cnt: 0, lastVisitDay: '' };

  MongoClient.connect( this.mongo_url, function(err, db) {
    if( err ){
      throw err;
    }

    // データベースを取得する
    var dbo = db.db( 'persons' );

    // コレクションを取得する
    var clo = dbo.collection( 'visitor' );

    var query = { gid: data.gid };

    // {gid: gid} のドキュメントを取得する
    clo.find( query ).toArray( function(err, documents){
      try{
        if (err){
          throw err;
        } else {
          db.close();
          callback( true, documents );
        }
      }
      catch( e ){
        console.log( "[DataPersons.js] e = " + e );
        callback( false, documents );
      }
    });
  });
}


/**
 * 引数の file からデータを読み出して訪問回数が多い Top 50 を取得する
 * @param {string} file - 対象のファイル ( フルパス )
 * @return {Object} data - 読み出したデータ
 * @example
 * GetRanking( '/media/pi/USBDATA/person.txt' );
*/
DataPersons.prototype.GetRanking = function( file ){
  console.log( "[DataPersons.js] GetRanking()" );
  console.log( "[DataPersons.js] file = " + file );

  var obj = new Array();
  var cnt = -1;

  var ret = this.ReadFile( file );
  if( ret !== false ){
    // JSON 配列の形式に整形
    obj = this.MakeJson( ret );

    obj.sort( function( val1, val2 ){
      var val1 = val1.cnt;
      var val2 = val2.cnt;
      if( val1 < val2 ){
        return 1;
      } else {
        return -1;
      }
    });
  }

  var rank = new Array();
  var i = 0;
  for( i=0; i < 20; i++ ){
//    console.log( "[DataPersons.js] name = " + obj[i].name );
//    console.log( "[DataPersons.js] cnt  = " + obj[i].cnt  );
    rank.push( {name:obj[i].name, cnt:obj[i].cnt} );
  }

//  console.log( "[DataPersons.js] obj = " + JSON.stringify(rank) );
  return rank;
}


/**
 * 引数の file の中身を読み出す
 * @param {string} file - 対象のファイル ( フルパス )
 * @return {Object} ret - 読み出したデータ
 * @example
 * var obj = ReadFile( "/media/pi/USBDATA/data.txt" );
*/
DataPersons.prototype.ReadFile = function( file ){
  console.log( "[DataPersons.js] ReadFile()" );
  console.log( "[DataPersons.js] file = " + file );

  var ret = false;
  try{
    fs.statSync( file );
    ret = fs.readFileSync( file, 'utf8' );
  } catch( err ){
    if( err.code === 'ENOENT' ){
      console.log( "[DataPersons.js] file does not exist." );
      ret = false;
    }
  }
  return ret;
}


/**
 * 文字列を JSON 形式に整形する
 * @param {string} string - 文字列
 * @return {Object} obj - JSON 形式のデータ
 * @example
 * var obj = MakeJson( str );
*/
DataPersons.prototype.MakeJson = function( string ){
  console.log( "[DataPersons.js] MakeJson()" );
//  console.log( "[DataPersons.js] file = " + string );

  var obj = new Array();
  var ret;

  ret = string.substr( 0, string.length - 2 );
  ret = '[ ' + ret + ' ]';
  obj = (new Function('return ' + ret))();
  return obj;
}


module.exports = DataPersons;


