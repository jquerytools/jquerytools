
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="/WEB-INF/flowplayer.tld" prefix="f" %>
<%@ taglib uri="http://piimaa.org/jtags" prefix="j" %>

<%
	String path = request.getServletPath().split("/")[2].replace(".html", "");
	pageContext.setAttribute("isDoc",
		"using,performance,search,release-notes,tabs,tooltip,scrollable,overlay,expose,flashembed,".indexOf(path +",") != -1
	);		
%>

<c:set var="isForum" value="${fn:contains(req.path, '/forum/')}"/>
<c:set var="showTweets" value="${fn:contains(req.path, 'download') || req.path == '/tools-1.2.0/index.html'}"/>
	

<style>
#right p.active a {
	text-decoration:underline !important;
	color:black;
	cursor:default;
}
</style>

<%-- demos --%>
<c:if test="${!empty req.demo}">

	<style>
		#right h2 {
			cursor:pointer;				
		}
	</style>
	
	<c:forEach items="${context.toolDemos.categories}" var="cat" varStatus="i">

		<div class="box">
			<h2>${cat.title}</h2>

			<ul style="display:none">
				<c:forEach items="${cat.demos}" var="demo">
					<li> <a href="${jqt}-1.2.0/demos/${demo.path}">${demo.title}</a> </li>
				</c:forEach>
			</ul>

			<div class="clear"></div>
			 
		</div>	
	</c:forEach>	
	
	<!-- accordion setup -->
	<script>
		$("#right").tabs("#right ul", {tabs: 'h2', initialIndex: ${req.demo.category.index}});
		$("#right h2").eq(${req.demo.category.index}).addClass("active");
	</script>
	
	
</c:if>

<%-- documentation --%>
<c:if test="${isDoc}">

	<c:if test="${!fn:contains(req.path, '/search.html')}">
		<script>$("#jqt4").addClass("active");</script>
	</c:if>	
	
	<div class="box">
		<h2>Documentation</h2>
		
		<ul>
			<li><a href="${jqt}/using.html">User's Guide</a></li>
			<li><a href="${jqt}/performance.html">Performance</a></li>			
		</ul>  
		
		<div class="clear"></div>
		 
	</div>			
	
	<br />
	
	<div class="box">
		<h2>The Tools</h2> 
		
		<ul>
			<li><a href="${jqt}/tabs.html">tabs</a></li>
			<li><a href="${jqt}/tooltip.html">tooltip</a></li>	
			<li><a href="${jqt}/scrollable.html">scrollable</a></li>
			<li><a href="${jqt}/overlay.html">overlay</a></li>
			<li><a href="${jqt}/expose.html">expose</a></li>
			<li><a href="${jqt}/flashembed.html">flashembed</a></li>
		</ul>  
		
		<div class="clear"></div>
		
	</div>		

	
	<h3>Release Notes</h3>
	
	<div id="notes">
		<p><a href="${jqt}/release-notes/index.html">Version 1.2.0</a></p>
		<p><a href="${jqt}/release-notes/version-1.1.2.html">Version 1.1.2</a></p>
		<p><a href="${jqt}/release-notes/version-1.1.1.html">Version 1.1.1</a></p>
		<p><a href="${jqt}/release-notes/version-1.1.0.html">Version 1.1.0</a></p>
		<p><a href="${jqt}/release-notes/version-1.0.X.html">Versions 1.0.X</a></p>
		<p><a href="${jqt}/release-notes/version-history.html">Full version history</a></p>			
	</div>			
	
	
	<script>
		$("#notes a[href=${req.path}]").addClass("active");
	</script>
		
</c:if>	

<%-- forum --%>
<c:if test="${isForum}">
	
	<div class="box" id="latestPosts">
	 
		<h2>Latest posts</h2> 
		
		<j:select size="5">
			SELECT
				Topic.id, title, Topic.modified, forumId, threadId, User.id userId, username, alias, email
			FROM 
				Topic, User 
			WHERE 
				Topic.userId = User.id
				AND forumId > 19
				AND forumId < 100				
			ORDER BY 
				id DESC
		</j:select>
		
		<ul>
			<c:forEach items="${rows}" var="row" varStatus="i">		
				<li>
					<a href="${jqt}/forum/${row.forumId}/${empty row.threadId ? row.id : row.threadId}#post-${row.id}">
						${row.title}					
						<span>${j:elapsed(row.modified)} by "${f:getName(row)}"</span>				
					</a>
				</li>
			</c:forEach>
		</ul>
	
		<div class="clear"></div>
		
	</div>
	
	<%-- the forums --%>
	<c:if test="${!fn:contains(req.path, '/forum/index.html')}">
		<div class="box">
		 
			<h2>Forum List</h2>  
		
			<ul>
				<c:forEach items="${forumNames2}" var="f">
					<li><a href="${jqt}/forum/${f.key}" id="forutabs/index.html?reload=truemLink${f.key}">${f.value}</a></li>
				</c:forEach>
			</ul>
			
			<div class="clear"></div>
			
		</div>
	</c:if>

	<script>
		$("#jqt5").addClass("active");
		$("#forumLink${param.forumId}").addClass("selected");
	</script>	
	
	
</c:if>

<%-- twitter link --%>
<div style="margin:color:#00519F;font-size:10px">
	&nbsp; follow jQuery Tools on
	<a href="http://twitter.com/jquerytools">
		<img src="http://assets0.twitter.com/images/twitter_logo_header.png" 
			title="Follow jQuery Tools on Twitter" />
	</a>
</div>

<%-- home & download --%>
<c:if test="${showTweets}">	
	<div id="twitter"></div>
</c:if>

