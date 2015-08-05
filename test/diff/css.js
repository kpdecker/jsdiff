import {diffCss} from '../../lib/diff/css';
import {convertChangesToXML} from '../../lib/convert/xml';

describe('diff/css', function() {
  describe('#diffCss', function() {
    it('should diff css', function() {
      var diffResult = diffCss(
        '.test,#value .test{margin-left:50px;margin-right:-40px}',
        '.test2, #value2 .test {\nmargin-top:50px;\nmargin-right:-400px;\n}');
      convertChangesToXML(diffResult).should.equal(
        '<del>.test</del><ins>.test2</ins>,<del>#value</del> <ins>#value2 </ins>.test<ins> </ins>{'
        + '<del>margin-left</del><ins>\nmargin-top</ins>:50px;<ins>\n</ins>'
        + 'margin-right:<del>-40px</del><ins>-400px;\n</ins>}');
    });
  });
});
