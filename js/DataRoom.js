/**
 * @fileoverview データクラスを定義したファイル
 * @author       Ryoji Morita
 * @version      0.0.1
*/

'use strict';

// 必要なライブラリをロード
let fs = require('fs');
let MongoClient  = require('mongodb').MongoClient;


/**
 * データ class
 * @param {void}
 * @constructor
 * @example
 * let obj = new DataRoom();
*/
let DataRoom = function() {
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
 * clear();
*/
DataRoom.prototype.clear = function() {
  console.log("[DataRoom.js] clear()");
  this.cnt = 0;
}


/**
 * 入場者数カウンタを更新する
 * @param {void}
 * @return {void}
 * @example
 * update();
*/
DataRoom.prototype.update = function() {
  console.log("[DataRoom.js] update()");
  this.cnt++;
  console.log("[DataRoom.js] cnt = " + this.cnt);
}


/**
 * 入場者数カウンタを取得する
 * @param {void}
 * @return {void}
 * @example
 * get();
*/
DataRoom.prototype.get = function() {
  console.log("[DataRoom.js] get()");
  console.log("[DataRoom.js] cnt = " + this.cnt);
  return this.cnt;
}


/**
 * 対象のコレクション (= day) にドキュメントを作成する。
 * @param {string} day - 日付。(MongoDB のコレクション名でも使用)
 * @param {string} hour - 時間。
 * @return {void}
 * @example
 * createDoc("2018-08-10", "08:00");
*/
DataRoom.prototype.createDoc = function(day, hour) {
  console.log("[DataRoom.js] createDoc()");

  let doc = { hour: hour, cnt: this.cnt };

  MongoClient.connect(this.mongo_url, function(err, db) {
    if(err) throw err;

    let dbo = db.db('room');        // データベースを取得する
    let clo = dbo.collection(day);  // コレクションを取得する

    // doc をデータベースに insert する
    clo.insertOne(doc, function(err, res) {
      try{
        if(err) throw err;

        db.close();
      }
      catch(e) {
        console.log("[DataRoom.js] e = " + e + " : " + e.message);
        db.close();
      }
    });
  });
}


/**
 * 指定した日付の訪問者数情報を取得する。
 * @param {string} day - 対象の日付。(MongoDB のコレクション名でも使用)
 * @param {function(boolean, Object.<string, number>)} callback - データを取得するためのコールバック関数
 * @return {void}
 * @example
 * getOneDay('2018-05-14', function(err, doc) {});
*/
DataRoom.prototype.getOneDay = function(day, callback) {
  console.log("[DataRoom.js] getOneDay()");
  console.log("[DataRoom.js] day    = " + day);

  let data = {'00-00': 0, '01-00': 0, '02-00': 0, '03-00': 0, '04-00': 0, '05-00': 0,
              '06-00': 0, '07-00': 0, '08-00': 0, '09-00': 0, '10-00': 0, '11-00': 0,
              '12-00': 0, '13-00': 0, '14-00': 0, '15-00': 0, '16-00': 0, '17-00': 0,
              '18-00': 0, '19-00': 0, '20-00': 0, '21-00': 0, '22-00': 0, '23-00': 0
             };

  MongoClient.connect(this.mongo_url, function(err, db) {
    if(err) throw err;

    let dbo = db.db('room');        // データベースを取得する
    let clo = dbo.collection(day);  // コレクションを取得する

    // コレクションに含まれるすべてのドキュメントを取得する
    clo.find({}).toArray(function(err, docs) {
      try{
        if(err) throw err;

        let i = 0;
        let len = docs.length;
        console.log("[DataRoom.js] len = " + len);

        for(i = 0; i < len; i++) {
          let hour = docs[i].hour;

          hour = hour.replace(':', '-');    // hh:mm を hh-mm の形式に置換する

          data[ hour ] = docs[i].cnt;
        }
        let ret = false;
        if(len == 24) {
          ret = true;
        }

        db.close();
        console.log("[DataRoom.js] data = " + JSON.stringify(data));
        callback(ret, data);
      }
      catch(e) {
        console.log("[DataRoom.js] e = " + e + " : " + e.message);
        db.close();
        callback(false, data);
      }
    });
  });
}




/**
 * 引数の file からデータを読み出して dataOneDay プロパティを更新する。
 * @param {string} file - 対象のファイル (フルパス)
 * @return {Object} ret - 読み出したデータ
 * @example
 * let obj = updateOneDay('/media/pi/USBDATA/2018-01-23_room.txt');
*/
DataRoom.prototype.updateOneDay = function(file) {
  console.log("[DataRoom.js] updateOneDay()");
  console.log("[DataRoom.js] file = " + file);

  let date = file.replace('/media/pi/USBDATA/', '');
  date = date.replace('_room.txt', '');

  this.date = date;
  console.log("[DataRoom.js] this.date = " + this.date);

  let ret = false;
  try{
    fs.statSync(file);
    let ret = fs.readFileSync(file, 'utf8');
    let obj = (new Function("return " + ret))();

    for(let key in this.dataOneDay) {
      this.dataOneDay[key] = obj[key];
    }
    console.log('[DataRoom.js] this.dataOneDay = ' + JSON.stringify(this.dataOneDay));
  } catch(err) {
    if(err.code === 'ENOENT') {
      console.log("[DataRoom.js] file does not exist.");
      for(let key in this.dataOneDay) {
        this.dataOneDay[key] = 0;
      }
      ret = false
    }
  }
  return ret;
};


/**
 * 引数の file の中身を更新する
 * @param {string} file - 対象のファイル (フルパス)
 * @return {void}
 * @example
 * appendFile("/media/pi/USBDATA/2018-01-23_room.txt");
*/
DataRoom.prototype.appendFile = function(file) {
  console.log("[DataRoom.js] appendFile()");
  console.log("[DataRoom.js] file = " + file);


  let date = new Date();
  let hour = toDoubleDigits(date.getHours());
  let str = '';

  if(hour == '00') {
    str += '{';
  }

  // hour から -1 した時間を this.hour にセット
  this.hour = toDoubleDigits(hour - 1) + '-00';
  str += '"' + this.hour + '"' + ':' + this.cnt;

  if(hour == '23') {
    str += '}';
  } else {
    str += ', ';
  }

  console.log("[DataRoom.js] hour = " + hour);
  console.log("[DataRoom.js] this.hour = " + this.hour);
  console.log("[DataRoom.js] str = " + str);

  try{
    fs.appendFileSync(file, str, 'utf8');
  } catch(err) {
    if(err.code === 'ENOENT') {
      console.log("[DataRoom.js] file does not exist.");
    }
  }

  this.cnt = 0;
}


/**
 * 数字が 1 桁の場合に 0 埋めで 2 桁にする
 * @param {number} num - 数値
 * @return {number} num - 0 埋めされた 2 桁の数値
 * @example
 * toDoubleDigits(8);
*/
let toDoubleDigits = function(num) {
  console.log("[DataRoom.js] toDoubleDigits()");
  console.log("[DataRoom.js] num = " + num);
  num += '';
  if(num.length === 1) {
    num = '0' + num;
  }
  return num;
};


module.exports = DataRoom;


