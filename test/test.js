var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;


var slate0 = require('slate0');
var Operations = slate0.Operations;
var m = slate0.model;
var ot = slate0.type;
var UndoManager = require('../');

describe('Undo manager', function() {
	var doc = new m.Document(1,[new m.Section(2,[new m.P(4,["This is some text."])]), new m.Section(3,[])]);
	var opsB = new Operations()
		.retain(22)
		.insert({_type:'P'})
		.insert('This is some text')
		.insert({_type:'Section'})
		.insert({_type:'H3'})
		.insert('this is more text')
		.end(doc.length).toOp();

	var other = new Operations()
		.retain(18)
		.insert(" that I want here.")
		.end(doc.length).toOp();

	var otherL = new Operations()
		.retain(22)
		.insert("This comes before. ")
		.end(doc.length).toOp();

	it('Can undo', function() {
		var um = new UndoManager(ot);
		um.add(opsB);
		var x = m.apply(doc, opsB);
		var y;
		um.performUndo(function(err, op) {
			y = m.apply(x, op);
			um.add(op);
		})
		assert.equal(JSON.stringify(y),JSON.stringify(doc));
	});
	it('Can redo', function() {
		var um = new UndoManager(ot);
		um.add(opsB);
		var x = m.apply(doc, opsB);
		var y, z;
		um.performUndo(function(err, op) {
			y = m.apply(x, op);
			um.add(op);
		});
		um.performRedo(function(err, op) {
			z = m.apply(y, op);
			um.add(op);
		});
		assert.equal(JSON.stringify(y),JSON.stringify(doc));
		assert.equal(JSON.stringify(z),JSON.stringify(x));
	});
	it('Can undo after other op', function() {
		var um = new UndoManager(ot);
		var justOther = m.apply(doc, other);
		var otherP = ot.transform(other, opsB);
		//our apply
		var x = m.apply(doc, opsB);
		um.add(opsB);
		//their apply
		var both = m.apply(x, otherP);
		um.transform(otherP);
		var y;
		um.performUndo(function(err, op) {
			y = m.apply(both, op);
			um.add(op);
		});
		assert.equal(JSON.stringify(justOther),JSON.stringify(y));
	});
	it('Can undo after other op with left', function() {
		var um = new UndoManager(ot);
		var justOther = m.apply(doc, otherL);
		var otherP = ot.transform(otherL, opsB, 'left');
		//our apply
		var x = m.apply(doc, opsB);
		um.add(opsB);
		//their apply
		var both = m.apply(x, otherP);
		um.transform(otherP);
		var y;
		um.performUndo(function(err, op) {
			y = m.apply(both, op);
			um.add(op);
		});
		assert.equal(JSON.stringify(justOther),JSON.stringify(y));
	});
	it('Can undo compose', function() {
		var um = new UndoManager(ot);
		var otherP = ot.transform(other, opsB);
		var x = m.apply(doc, opsB);
		um.add(opsB, true);
		var both = m.apply(x, otherP);
		um.add(otherP, true);
		var y;
		um.performUndo(function(err, op) {
			y = m.apply(both, op);
			um.add(op);
		});
		assert.equal(JSON.stringify(y),JSON.stringify(doc));
	});
})