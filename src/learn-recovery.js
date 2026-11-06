(function () {
'use strict';
if (typeof document === 'undefined') return;
const host = document.getElementById('recoveryDetective');
if (!host) return;
// Fixed public fixtures from KeySense test/vectors.js. No key derivation or user secrets.
const examples={
 legacy:{path:"m/44'/0'/0'/0/0",address:'1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA'},
 native:{path:"m/84'/0'/0'/0/0",address:'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu'},
 taproot:{path:"m/86'/0'/0'/0/0",address:'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr'}
};
const el=id=>document.getElementById('rd-' + id);
let assisted=false;
function selected(){return host.querySelector('input[name="rd-format"]:checked').value;}
function render(){
 const example=examples[selected()];
 el('address').textContent=example.address;el('path').textContent=example.path;
 el('result').classList.remove('matched');el('match').textContent='Compare the current address with your old record.';
 el('explain').hidden=true;el('complete').hidden=true;el('feedback').textContent='';
 host.querySelectorAll('input[name="rd-reason"]').forEach(input=>input.checked=false);
}
host.querySelectorAll('input[name="rd-format"]').forEach(input=>input.addEventListener('change',render));
el('compare').addEventListener('click',()=>{
 const match=selected()==='native';
 el('result').classList.toggle('matched',match);
 el('match').textContent=match?'Address matches. The words stayed the same; the path changed.':'Not a match. This is another valid address from the same words. Try the format named in your old record.';
 el('explain').hidden=!match;
});
el('hint').addEventListener('click',()=>{assisted=true;el('hintText').hidden=false;});
el('check').addEventListener('click',()=>{
 const answer=host.querySelector('input[name="rd-reason"]:checked');
 if(!answer){el('feedback').textContent='Choose an explanation first.';return;}
 const correct=answer.value==='route';
 el('complete').hidden=!correct;
 el('feedback').textContent=correct?'Correct. Nothing moved, and the seed words did not change.':'No coins moved. Different paths can make different valid addresses from the same seed. Try again.';
 if(!correct)assisted=true;
 el('completionNote').textContent=assisted?'Completed with help. Try again later to see what you remember.':'You matched the address and explained why it changed.';
});
el('reset').addEventListener('click',()=>{
 assisted=false;host.querySelector('input[value="legacy"]').checked=true;el('hintText').hidden=true;render();el('compare').focus();
});
render();

})();
