{include file='redirect.tpl'}
{assign var="htmlTitle" value="{#omegaupTitleRank#}"}
{include file='head.tpl'}
{include file='mainmenu.tpl'}
{include file='status.tpl'}

{include file='rank.table.tpl' rank=$rank page=$page}

<script>
	$(".navbar #nav-rank").addClass("active");
</script>

{include file='footer.tpl'}
