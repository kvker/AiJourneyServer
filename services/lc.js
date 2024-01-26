"use strict";
const AV = require('leanengine');
module.exports = {
    AV: AV,
    become: (session) => {
        return AV.User.become(session).then((user) => {
            // 登录成功
            return user;
        }, (error) => {
            // session token 无效
            console.log(error);
        });
    },
    /**
     * 批量创建
     * @param {array} objects
     */
    createAll(objects) {
        return AV.Object.saveAll(objects);
    },
    /**
     * 批量删除
     * @param {array} objects
     */
    deleteAll(objects) {
        return AV.Object.destroyAll(objects);
    },
    /**
     * 批量更新
     * @param {array} objects
     */
    updateAll(objects) {
        return AV.Object.fetchAll(objects);
    },
    /**
     * 批量保存
     * @param {array} objects
     */
    saveAll(objects) {
        try {
            return AV.Object.saveAll(objects);
        }
        catch (err) {
            console.log(err.message);
        }
    },
    /**
     * av新增对象
     * @param {string} classs 新增对象的类
     * @param {object} params 新增参数
     */
    create(classs, params, options) {
        try {
            return (new (AV.Object.extend(classs))).set(params).save();
        }
        catch (err) {
            console.log(err.message);
        }
    },
    createObject(classs, id) {
        return AV.Object.createWithoutData(classs, id);
    },
    /**
     * av基础获取
     * @param {string} classs 搜索类名
     * @param {function} cbForQuery 设置查询条件的中介函数
     */
    read(classs, cbForQuery) {
        var query = new AV.Query(classs);
        // 如果需要额外设置条件，则通过传入这个函数处理
        if (cbForQuery) {
            // 如果是组合搜索，替换处理
            var temp_q = cbForQuery(query);
            if (temp_q) {
                query = temp_q;
            }
        }
        return query.find();
    },
    query(classs, cbForQuery) {
        return this.read(classs, cbForQuery);
    },
    one(classs, cbForQuery) {
        return this.read(classs, cbForQuery).then((res) => res[0]);
    },
    /**
    * av基础获取
    * @param {string} classs 搜索类名
    * @param {function} cbForQuery 设置查询条件的中介函数
    */
    readTotal(classs, cbForQuery) {
        var query = new AV.Query(classs);
        // 如果需要额外设置条件，则通过传入这个函数处理
        if (cbForQuery) {
            // 如果是组合搜索，替换处理
            var temp_q = cbForQuery(query);
            if (temp_q) {
                query = temp_q;
            }
        }
        let result;
        return query.find()
            .then((res) => {
            result = res;
            return query.count();
        })
            .then((res) => {
            return {
                data: result,
                count: res
            };
        });
    },
    /**
     * av更新对象
     * @param {string} classs 更新对象的类
     * @param {string} id 更新对象的objectId
     * @param {object} params 更新内容
     */
    update(classs, id, params) {
        var obj = AV.Object.createWithoutData(classs, id);
        // 设置属性
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var element = params[key];
                obj.set(key, element);
            }
        }
        return obj.save();
    },
    /**
     * av删除对象
     * @param {string} classs 删除对象的类
     * @param {string} id 删除对象的objectId
     */
    delete(classs, id) {
        var obj = AV.Object.createWithoutData(classs, id);
        return obj.destroy();
    },
    /**
     * 上传资源文件
     * @param {string} pat 文件路径
     */
    upload(base64, filename = new Date().getTime() / 1000 + '.png') {
        return new AV.File(filename, {
            base64,
        }).save();
    },
    /**
     * 上传小程序资源文件
     * @param {string} pat 文件路径
     */
    uploadMpFile(path) {
        return new AV.File(path, {
            blob: {
                uri: path,
            },
        }).save();
    },
    /**
     * 上传资源文件
     * @param {string} pat 文件路径
     */
    uploadBase64(base64, file_name) {
        return this.upload(base64, file_name);
    },
    uploadFile(file, file_name = new Date().getTime() / 1000 + '.png') {
        return new AV.File(file_name, file).save();
    },
    /**
     * av基础获取数量
     * @param {string} classs 搜索类名
     * @param {function} cbForQuery 设置查询条件的中介函数
     */
    count(classs, cbForQuery) {
        var query = new AV.Query(classs);
        // 如果需要额外设置条件，则通过传入这个函数处理
        if (cbForQuery) {
            cbForQuery(query);
        }
        return query.count();
    },
    /**
     * 获取当前用户
     */
    currentUser() {
        return AV.User.current();
    },
};
