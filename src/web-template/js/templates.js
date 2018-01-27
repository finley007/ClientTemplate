this["app"] = this["app"] || {};
this["app"]["comp"] = this["app"]["comp"] || {};

this["app"]["comp"]["menu"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<ul class=\"menu\">\n    <li><a href=\"\"><span>我的文件</span></a></li>\n    <li class=\"sep\"></li>\n    <li><a href=\"\"><span>账户中心</span></a></li>\n    <li><a href=\"\"><span>个人主页</span></a></li>\n    <li><a href=\"\"><span>入门教程</span></a></li>\n    <li class=\"sep\"></li>\n    <li id=\"updatelog-btn\"><a href=\"\"><span>退出登录</span></a></li>\n</ul>";
},"useData":true});

this["app"]["comp"]["person"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<table>\n    <tr>\n        <td>This is "
    + alias4(((helper = (helper = helpers.firstname || (depth0 != null ? depth0.firstname : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"firstname","hash":{},"data":data}) : helper)))
    + " "
    + alias4(((helper = (helper = helpers.lastname || (depth0 != null ? depth0.lastname : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lastname","hash":{},"data":data}) : helper)))
    + "</td>\n    </tr>\n</table>";
},"useData":true});