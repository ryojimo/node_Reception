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
 * UpdateMDDoc( '{...}' );
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
 * GetMDDocData( '{...}' );
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
    console.log( "[DataPersons.js] query = " + JSON.stringify(query) );
    clo.find( query ).toArray( function(err, documents){
      try{
        if (err){
          throw err;
        } else {
          db.close();
          console.log( "[DataPersons.js] documents.length = " + documents.length );
          console.log( "[DataPersons.js] documents        = " + JSON.stringify(documents) );
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
 * 訪問回数が多い Top 50 を取得する
 * @param {obj} callback - データを取得するためのコールバック関数
 * @return {void}
 * @example
 * GetRankingTop50( '{...}' );
*/
DataPersons.prototype.GetRankingTop50 = function( callback ){
  console.log( "[DataPersons.js] GetRankingTop50()" );

//  var data = { gid: data.gid, name: data.name, cnt: 0, lastVisitDay: '' };

  MongoClient.connect( this.mongo_url, function(err, db) {
    if( err ){
      throw err;
    }

    // データベースを取得する
    var dbo = db.db( 'persons' );

    // コレクションを取得する
    var clo = dbo.collection( 'visitor' );

    var sort = { cnt: -1 };

    // ドキュメントを取得する
    clo.find( {}, {sort:{cnt: -1}, limit:50} ).toArray( function(err, documents){
      try{
        if (err){
          throw err;
        } else {
          db.close();

          console.log( "[DataPersons.js] documents = " + JSON.stringify(documents) );
          console.log( "[DataPersons.js] documents.length = " + documents.length );
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


module.exports = DataPersons;


