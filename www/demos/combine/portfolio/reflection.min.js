/*
	reflection.js for jQuery v1.02
	(c) 2006-2008 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/
(function(a){a.fn.extend({reflect:function(b){b=a.extend({height:0.33,opacity:0.5},b);return this.unreflect().each(function(){var c=this;if(/^img$/i.test(c.tagName)){function d(){var j,g=Math.floor(c.height*b.height),k,f,i;if(a.browser.msie){j=a("<img />").attr("src",c.src).css({width:c.width,height:c.height,marginBottom:-c.height+g,filter:"flipv progid:DXImageTransform.Microsoft.Alpha(opacity="+(b.opacity*100)+", style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy="+(b.height*100)+")"})[0]}else{j=a("<canvas />")[0];if(!j.getContext){return}f=j.getContext("2d");try{a(j).attr({width:c.width,height:g});f.save();f.translate(0,c.height-1);f.scale(1,-1);f.drawImage(c,0,0,c.width,c.height);f.restore();f.globalCompositeOperation="destination-out";i=f.createLinearGradient(0,0,0,g);i.addColorStop(0,"rgba(255, 255, 255, "+(1-b.opacity)+")");i.addColorStop(1,"rgba(255, 255, 255, 1.0)");f.fillStyle=i;f.rect(0,0,c.width,g);f.fill()}catch(h){return}}a(j).css({display:"block",border:0});k=a(/^a$/i.test(c.parentNode.tagName)?"<span />":"<div />").insertAfter(c).append([c,j])[0];k.className=c.className;a.data(c,"reflected",k.style.cssText=c.style.cssText);a(k).css({width:c.width,height:c.height+g,overflow:"hidden"});c.style.cssText="display: block; border: 0px";c.className="reflected"}if(c.complete){d()}else{a(c).load(d)}}})},unreflect:function(){return this.unbind("load").each(function(){var c=this,b=a.data(this,"reflected"),d;if(b!==undefined){d=c.parentNode;c.className=d.className;c.style.cssText=b;a.removeData(c,"reflected");d.parentNode.replaceChild(c,d)}})}})})(jQuery);

// AUTOLOAD CODE BLOCK (MAY BE CHANGED OR REMOVED)
jQuery(function($) {
	$("img.reflect").reflect({/* Put custom options here */});
});