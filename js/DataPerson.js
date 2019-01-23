/**
 * @fileoverview データクラスを定義したファイル
 * @author       Ryoji Morita
 * @version      0.0.1
*/

'use strict';

// 必要なライブラリをロード
require('date-utils');

const ApiCmn = require('./ApiCmn');
let g_apiCmn = new ApiCmn();


/**
 * データ class
 * @param {void}
 * @constructor
 * @example
 * let obj = new DataPerson();
*/
class DataPerson {

  constructor(jsonObj) {
    this.data = {
      gid: "",            // @type {string} : 訪問者の Global ID
      name: "",           // @type {string} : 訪問者の名前
      cnt: 0,             // @type {number} : 訪問回数
      lastVisitDay: "",   // @type {string} : 最後に来た日にち
    };

    this.data = jsonObj;
  }


  /**
   * this.data を取得する。
   * @param {void}
   * @return {object} - this.data
   * @example
   * get();
  */
  get() {
    return this.data;
  }


  /**
   * this.data に値をセットする。
   * @param {object} - セットする json 形式のデータ
   * @return {void}
   * @example
   * set();
  */
  set(jsonObj) {
    this.data = jsonObj;
  }


  /**
   * this.data.cnt, this.data.lastVisiteDay を更新する。
   * @param {void}
   * @return {void}
   * @example
   * update();
  */
  update() {
    console.log("[DataPerson.js] update()");

    this.data.cnt++;
    this.lastVisitDay = g_apiCmn.yyyymmdd();
  }


};


module.exports = DataPerson;


