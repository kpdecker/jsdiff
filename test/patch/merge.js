import {merge} from '../../lib/patch/merge';
import {parsePatch} from '../../lib/patch/parse';

import {expect} from 'chai';

describe('patch/merge', function() {
  describe('#merge', function() {
    it('should update line numbers for no conflicts', function() {
      const mine =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,3 +1,4 @@\n'
            + ' line2\n'
            + ' line3\n'
            + '+line4\n'
            + ' line5\n';
      const theirs =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -25,3 +25,4 @@\n'
            + ' foo2\n'
            + ' foo3\n'
            + '+foo4\n'
            + ' foo5\n';

      const expected = {
        index: 'test',
        oldFileName: 'test',
        oldHeader: 'header1',
        newFileName: 'test',
        newHeader: 'header2',
        hunks: [
          {
            oldStart: 1, oldLines: 3,
            newStart: 1, newLines: 4,
            lines: [
              ' line2',
              ' line3',
              '+line4',
              ' line5'
            ]
          },
          {
            oldStart: 25, oldLines: 3,
            newStart: 26, newLines: 4,
            lines: [
              ' foo2',
              ' foo3',
              '+foo4',
              ' foo5'
            ]
          }
        ]
      };

      expect(merge(mine, theirs)).to.eql(expected);
      expect(merge(theirs, mine)).to.eql(expected);
    });
    it('should remove identical hunks', function() {
      const mine =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,3 +1,4 @@\n'
            + ' line2\n'
            + ' line3\n'
            + '+line4\n'
            + ' line5\n';
      const theirs =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,3 +1,4 @@\n'
            + ' line2\n'
            + ' line3\n'
            + '+line4\n'
            + ' line5\n';

      const expected = {
        index: 'test',
        oldFileName: 'test',
        oldHeader: 'header1',
        newFileName: 'test',
        newHeader: 'header2',
        hunks: [
          {
            oldStart: 1, oldLines: 3,
            newStart: 1, newLines: 4,
            lines: [
              ' line2',
              ' line3',
              '+line4',
              ' line5'
            ]
          }
        ]
      };

      expect(merge(mine, theirs)).to.eql(expected);
      expect(merge(theirs, mine)).to.eql(expected);
    });
    describe('hunk merge', function() {
      it('should merge adjacent additions', function() {
        const mine =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '+line4-1\n'
              + '+line4-2\n'
              + '+line4-3\n'
              + ' line5\n';
        const theirs =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -2,2 +2,3 @@\n'
              + ' line3\n'
              + ' line5\n'
              + '+line4-4\n';

        const expected = {
          index: 'test',
          oldFileName: 'test',
          oldHeader: 'header1',
          newFileName: 'test',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 7,
              lines: [
                ' line2',
                ' line3',
                '+line4-1',
                '+line4-2',
                '+line4-3',
                ' line5',
                '+line4-4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should merge leading additions', function() {
        const mine =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -1,3 +1,4 @@\n'
              + '+line2\n'
              + ' line3\n'
              + '+line4\n'
              + ' line5\n';
        const theirs =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -3,1 +3,2 @@\n'
              + ' line5\n'
              + '+line4\n';

        const expected = {
          index: 'test',
          oldFileName: 'test',
          oldHeader: 'header1',
          newFileName: 'test',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 2,
              newStart: 1, newLines: 5,
              lines: [
                '+line2',
                ' line3',
                '+line4',
                ' line5',
                '+line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });

      it('should merge adjacent removals', function() {
        const mine =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + '-line3\n'
              + '+line4\n'
              + ' line5\n';
        const theirs =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -2,2 +2,3 @@\n'
              + ' line3\n'
              + ' line5\n'
              + '+line4\n';

        const expected = {
          index: 'test',
          oldFileName: 'test',
          oldHeader: 'header1',
          newFileName: 'test',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 3,
              lines: [
                '-line2',
                '-line3',
                '+line4',
                ' line5',
                '+line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });

      it('should merge adjacent additions with context removal', function() {
        const mine =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '+line4-1\n'
              + '+line4-2\n'
              + '+line4-3\n'
              + '-line5\n';
        const theirs =
              'Index: test\n'
              + '===================================================================\n'
              + '--- test\theader1\n'
              + '+++ test\theader2\n'
              + '@@ -2,2 +2,3 @@\n'
              + ' line3\n'
              + ' line5\n'
              + '+line4-4\n';

        const expected = {
          index: 'test',
          oldFileName: 'test',
          oldHeader: 'header1',
          newFileName: 'test',
          newHeader: 'header2',
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 6,
              lines: [
                ' line2',
                ' line3',
                '+line4-1',
                '+line4-2',
                '+line4-3',
                '-line5',
                '+line4-4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });

      it('should merge removal supersets', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '-line4\n'
              + '-line4\n'
              + ' line5\n';
        const theirs =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '-line4\n'
              + ' line4\n'
              + ' line5\n';

        const expected = {
          hunks: [
            {
              oldStart: 1, oldLines: 5,
              newStart: 1, newLines: 3,
              lines: [
                ' line2',
                ' line3',
                '-line4',
                '-line4',
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should conflict removal disjoint sets', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '-line4\n'
              + '-line4\n'
              + '-line4\n'
              + ' line5\n';
        const theirs =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '-line4\n'
              + '-line4\n'
              + '-line5\n'
              + ' line5\n';

        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                ' line2',
                ' line3',
                {
                  conflict: true,
                  mine: [
                    '-line4',
                    '-line4',
                    '-line4'
                  ],
                  theirs: [
                    '-line4',
                    '-line4',
                    '-line5'
                  ]
                },
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });

      it('should conflict removal disjoint context', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '-line4\n'
              + '-line4\n'
              + '-line4\n'
              + ' line5\n';
        const theirs =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '-line4\n'
              + '-line4\n'
              + ' line5\n'
              + ' line5\n';

        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                ' line2',
                ' line3',
                {
                  conflict: true,
                  mine: [
                    '-line4',
                    '-line4',
                    '-line4'
                  ],
                  theirs: [
                    '-line4',
                    '-line4'
                  ]
                },
                ' line5',
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });

      // These are all conflicts. A conflict is anything that is on the same desired line that is not identical
      it('should conflict two additions at the same line', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '+line4-1\n'
              + '+line4-2\n'
              + '+line4-3\n'
              + ' line5\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + ' line3\n'
              + '+line4-4\n';
        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                ' line2',
                ' line3',
                {
                  conflict: true,
                  mine: [
                    '+line4-1',
                    '+line4-2',
                    '+line4-3'
                  ],
                  theirs: [
                    '+line4-4'
                  ]
                },
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should conflict addition supersets', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '+line4\n'
              + '+line4\n'
              + ' line5\n';
        const theirs =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n'
              + '+line4\n'
              + ' line5\n';
        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                ' line2',
                ' line3',
                {
                  conflict: true,
                  mine: [
                    '+line4',
                    '+line4'
                  ],
                  theirs: [
                    '+line4'
                  ]
                },
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle removal and edit (add+remove) at the same line', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + '-line3\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '+line4\n';
        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                ' line2',
                {
                  conflict: true,
                  mine: [
                    '-line3'
                  ],
                  theirs: [
                    '-line3',
                    '+line4'
                  ]
                }
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit (add+remove) on multiple lines', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + ' line3\n'
              + ' line3\n'
              + ' line5\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '-line3\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              oldStart: 1, oldLines: 4,
              newStart: 1, newLines: 3,
              lines: [
                '-line2',
                '-line3',
                '-line3',
                '+line4',
                '+line4',
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit (add+remove) past extents', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + ' line3\n'
              + ' line3\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '-line3\n'
              + '-line5\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              oldStart: 1, oldLines: 4,
              newStart: 1, newLines: 2,
              lines: [
                '-line2',
                '-line3',
                '-line3',
                '-line5',
                '+line4',
                '+line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit (add+remove) past extents', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + ' line3\n'
              + ' line3\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '-line3\n'
              + '-line5\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              oldStart: 1, oldLines: 4,
              newStart: 1, newLines: 2,
              lines: [
                '-line2',
                '-line3',
                '-line3',
                '-line5',
                '+line4',
                '+line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit (add+remove) context mismatch', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + ' line3\n'
              + ' line4\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '-line3\n'
              + '-line5\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                '-line2',
                {
                  conflict: true,
                  mine: [
                    ' line3'
                  ],
                  theirs: [
                    '-line3',
                    '-line3',
                    '-line5',
                    '+line4',
                    '+line4'
                  ]
                },
                ' line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit (add+remove) addition', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + ' line3\n'
              + '+line6\n'
              + ' line3\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '-line3\n'
              + '-line5\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                '-line2',
                {
                  conflict: true,
                  mine: [
                    ' line3',
                    '+line6',
                    ' line3'
                  ],
                  theirs: [
                    '-line3',
                    '-line3',
                    '-line5',
                    '+line4',
                    '+line4'
                  ]
                }
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit (add+remove) on multiple lines with context', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + '-line3\n'
              + ' line3\n'
              + ' line5\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + '-line3\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                ' line2',
                {
                  conflict: true,
                  mine: [
                    '-line3'
                  ],
                  theirs: [
                    '-line3',
                    '-line3',
                    '+line4',
                    '+line4'
                  ]
                },
                    ' line3',   // TODO: Fix
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should conflict edit with remove in middle', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + ' line3\n'
              + '-line3\n'
              + ' line5\n';
        const theirs =
              '@@ -1,3 +1,2 @@\n'
              + ' line2\n'
              + '-line3\n'
              + '-line3\n'
              + '+line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                '-line2',
                {
                  conflict: true,
                  mine: [
                    ' line3',
                    '-line3'
                  ],
                  theirs: [
                    '-line3',
                    '-line3',
                    '+line4',
                    '+line4'
                  ]
                },
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should handle edit and addition with context connextion', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + '-line3\n'
              + '-line4\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + ' line3\n'
              + ' line4\n'
              + '+line4\n';

        const expected = {
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 2,
              lines: [
                ' line2',
                '-line3',
                '-line4',
                '+line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });

      it('should merge removals that start in the leading section', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + '-line3\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + ' line4\n';
        const expected = {
          hunks: [
            {
              oldStart: 1, oldLines: 3,
              newStart: 1, newLines: 1,
              lines: [
                '-line2',
                '-line3',
                ' line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should conflict edits that start in the leading section', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '-line2\n'
              + '-line3\n'
              + '-line3\n'
              + '-line3\n'
              + '-line3\n'
              + '+line4\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + ' line3\n'
              + ' line3\n'
              + '-line3\n'
              + '-line3\n'
              + ' line5\n';
        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                '-line2',
                {
                  conflict: true,
                  mine: [
                    '-line3',
                    '-line3',
                    '-line3',
                    '-line3',
                    '+line4'
                  ],
                  theirs: [
                    ' line3',
                    ' line3',
                    '-line3',
                    '-line3'
                  ]
                },
                ' line5'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should conflict adds that start in the leading section', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + '+line2\n'
              + '+line3\n';
        const theirs =
              '@@ -2 +2,2 @@\n'
              + '-line3\n'
              + ' line4\n';
        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                '+line2',
                {
                  conflict: true,
                  mine: [
                    '+line3'
                  ],
                  theirs: [
                    '-line3'
                  ]
                },
                ' line4'
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
      it('should conflict context mismatch', function() {
        const mine =
              '@@ -1,3 +1,4 @@\n'
              + ' line2\n'
              + ' line3\n';
        const theirs =
              '@@ -1 +1,2 @@\n'
              + ' line3\n'
              + ' line4\n';
        const expected = {
          hunks: [
            {
              conflict: true,
              oldStart: 1,
              newStart: 1,
              lines: [
                {
                  conflict: true,
                  mine: [
                    ' line2',
                    ' line3'
                  ],
                  theirs: [
                    ' line3',
                    ' line4'
                  ]
                }
              ]
            }
          ]
        };

        expect(merge(mine, theirs)).to.eql(expected);

        swapConflicts(expected);
        expect(merge(theirs, mine)).to.eql(expected);
      });
    });

    it('should handle file name updates', function() {
      const mine =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test2\theader2\n';
      const theirs =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n';
      const expected = {
        index: 'test',
        oldFileName: 'test',
        oldHeader: 'header1',
        newFileName: 'test2',
        newHeader: 'header2',
        hunks: []
      };
      expect(merge(mine, theirs)).to.eql(expected);
      expect(merge(theirs, mine)).to.eql(expected);
    });
    it('should handle file name conflicts', function() {
      const mine =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test-a\theader-a\n'
            + '+++ test2\theader2\n';
      const theirs =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test-b\theader-b\n'
            + '+++ test3\theader3\n';
      const partialMatch =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test-b\theader-a\n'
            + '+++ test3\theader3\n';

      expect(merge(mine, theirs)).to.eql({
        conflict: true,
        index: 'test',
        oldFileName: {
          mine: 'test-a',
          theirs: 'test-b'
        },
        oldHeader: {
          mine: 'header-a',
          theirs: 'header-b'
        },
        newFileName: {
          mine: 'test2',
          theirs: 'test3'
        },
        newHeader: {
          mine: 'header2',
          theirs: 'header3'
        },
        hunks: []
      });
      expect(merge(mine, partialMatch)).to.eql({
        conflict: true,
        index: 'test',
        oldFileName: {
          mine: 'test-a',
          theirs: 'test-b'
        },
        oldHeader: 'header-a',
        newFileName: {
          mine: 'test2',
          theirs: 'test3'
        },
        newHeader: {
          mine: 'header2',
          theirs: 'header3'
        },
        hunks: []
      });
    });
    it('should select available headers', function() {
      const mine =
            'Index: test\n'
            + '===================================================================\n'
            + '--- test\theader1\n'
            + '+++ test\theader2\n'
            + '@@ -1,3 +1,4 @@\n'
            + ' line2\n'
            + ' line3\n'
            + '+line4\n'
            + ' line5\n';
      const theirs =
            '@@ -25,3 +25,4 @@\n'
            + ' foo2\n'
            + ' foo3\n'
            + '+foo4\n'
            + ' foo5\n';

      const expected = {
        index: 'test',
        oldFileName: 'test',
        oldHeader: 'header1',
        newFileName: 'test',
        newHeader: 'header2',
        hunks: [
          {
            oldStart: 1, oldLines: 3,
            newStart: 1, newLines: 4,
            lines: [
              ' line2',
              ' line3',
              '+line4',
              ' line5'
            ]
          },
          {
            oldStart: 25, oldLines: 3,
            newStart: 26, newLines: 4,
            lines: [
              ' foo2',
              ' foo3',
              '+foo4',
              ' foo5'
            ]
          }
        ]
      };

      expect(merge(mine, theirs)).to.eql(expected);
      expect(merge(theirs, mine)).to.eql(expected);
      expect(merge(mine, parsePatch(theirs)[0])).to.eql(expected);
      expect(merge(theirs, parsePatch(mine)[0])).to.eql(expected);
    });

    it('should diff from base', function() {
      expect(merge('foo\nbar\nbaz\n', 'foo\nbaz\nbat\n', 'foo\nbaz\n')).to.eql({
        hunks: [
          {
            oldStart: 1, oldLines: 2,
            newStart: 1, newLines: 4,
            lines: [
              ' foo',
              '+bar',
              ' baz',
              '+bat'
            ]
          }
        ]
      });
    });
    it('should error if not passed base', function() {
      expect(function() {
        merge('foo', 'foo');
      }).to['throw']('Must provide a base reference or pass in a patch');
    });
  });
});

function swapConflicts(expected) {
  expected.hunks.forEach(function(hunk) {
    hunk.lines.forEach(function(line) {
      if (line.conflict) {
        let tmp = line.mine;
        line.mine = line.theirs;
        line.theirs = tmp;
      }
    });
  });
}
