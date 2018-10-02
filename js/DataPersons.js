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
 * createDoc( {} );
*/
DataPersons.prototype.createDoc = function( data ){
  console.log( "[DataPersons.js] createDoc()" );
  console.log( "[DataPersons.js] data = " + JSON.stringify(data) );

  MongoClient.connect( this.mongo_url, function(err, db){
    if( err ) throw err;

    var dbo = db.db( 'persons' );           // データベースを取得する
    var clo = dbo.collection( 'visitor' );  // コレクションを取得する

    // doc をデータベースに insert する
    clo.insertOne( data, function(err, res){
      try{
        if( err ) throw err;

        db.close();
      }
      catch( e ){
        console.log( "[DataPersons.js] e = " + e + " : " + e.message );
        db.close();
      }
    });
  });
}


/**
 * Mongodb にデータベース、コレクション、ドキュメントを更新する。
 * @param {Object.<string, string>} data - JSON 文字列
 * @return {void}
 * @example
 * updateMDDoc( {} );
*/
DataPersons.prototype.updateMDDoc = function( data ){
  console.log( "[DataPersons.js] updateMDDoc()" );
  console.log( "[DataPersons.js] data = " + JSON.stringify(data) );

  MongoClient.connect( this.mongo_url, function(err, db){
    if( err ) throw err;

    var dbo = db.db( 'persons' );           // データベースを取得する
    var clo = dbo.collection( 'visitor' );  // コレクションを取得する

    var query = { gid: data.gid };
    var newvalues = { $set: {cnt: data.cnt, lastVisitDay: data.lastVisitDay } };

    // doc をデータベースに insert する
    clo.updateOne( query, newvalues, function(err, res){
      try{
        if( err ) throw err;

        db.close();
      }
      catch( e ){
        console.log( "[DataPersons.js] e = " + e + " : " + e.message );
        db.close();
      }
    });
  });
}


/**
 * コレクションの全ドキュメントに対して query に一致するドキュメントを問い合わせる。
 * @param {Object} query - 問い合わせの情報
 * @param {function(boolean, Object)} callback - データを取得するためのコールバック関数
 * @return {void}
 * @example
 * query( {'gid': 0000114347}, function( err, doc ){} );
*/
DataPersons.prototype.query = function( query, callback ){
  console.log( "[DataPersons.js] query()" );
  console.log( "[DataPersons.js] query = " + JSON.stringify(query) );

  MongoClient.connect( this.mongo_url, function(err, db){
    if( err ) throw err;

    var dbo = db.db( 'persons' );           // データベースを取得する
    var clo = dbo.collection( 'visitor' );  // コレクションを取得する

    clo.find( query ).toArray( function(err, docs){
      try{
        if( err ) throw err;

        db.close();
        console.log( "[DataPersons.js] docs.length = " + docs.length );
//        console.log( "[DataPersons.js] docs        = " + JSON.stringify(docs) );
        callback( true, docs );
      }
      catch( e ){
        console.log( "[DataPersons.js] e = " + e + " : " + e.message );
        db.close();
        callback( false, docs );
      }
    });
  });
}


/**
 * 訪問回数が多い Top 50 を取得する
 * @param {function(boolean, Object)} callback - データを取得するためのコールバック関数
 * @return {void}
 * @example
 * getRankingTop50( function( err, doc ){} );
*/
DataPersons.prototype.getRankingTop50 = function( callback ){
  console.log( "[DataPersons.js] getRankingTop50()" );

  MongoClient.connect( this.mongo_url, function(err, db){
    if( err ) throw err;

    var dbo = db.db( 'persons' );           // データベースを取得する
    var clo = dbo.collection( 'visitor' );  // コレクションを取得する

    var sort = { cnt: -1 };

    // ドキュメントを取得する
    clo.find( {}, {sort:{cnt: -1}, limit:50} ).toArray( function(err, docs){
      try{
        if (err) throw err;

        db.close();
        console.log( "[DataPersons.js] docs.length = " + docs.length );
//        console.log( "[DataPersons.js] docs = " + JSON.stringify(docs) );
        callback( true, docs );
      }
      catch( e ){
        console.log( "[DataPersons.js] e = " + e + " : " + e.message );
        db.close();
        callback( false, docs );
      }
    });
  });
}


module.exports = DataPersons;


