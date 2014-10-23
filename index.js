var _ = require('lodash');
var through = require('through2');
var File = require('vinyl');
var Execution = require('execution');
var Record = require('record');

function createStream(inputs) {

    var stream = through.obj();

    inputs.forEach(function(record){
        var contents = record.contents;
        stream.write(new File({
            // cwd: "",
            // base: "",
            path: record.path,
            contents: ((contents instanceof Buffer) ? contents : new Buffer(contents))
        }));
    });

    return stream;
}

module.exports = function (plugin){

    return Execution.extend({
        execute: function (resolve, reject) {
            var options = this.options;
            var logger = this.logger;
            var inputs = this.inputs;

            var args = [];
            if(options.$1){
                _.each(options, function(arg, key){
                    args[ Number(key.slice(1))-1 ] = arg;
                });
            }else{
                args.push(options);
            }

            var records = [];
            var transform = plugin.apply(null, args);
            var stream = createStream(inputs);

            stream.pipe(transform)
                .pipe(through.obj(function(file, encode, done){
                    var record = new Record({
                        path: file.path,
                        contents: file.contents
                    });
                    records.push(record);
                    done();
                }, function(){
                    resolve(records);
                }));

            stream.end();
        }
    });

};
