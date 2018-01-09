app.controller('infoCtrl', ['$scope', '$rootScope', '$location', '$document', '$window', '$anchorScroll', 'ngDialog', 'Idle', function ($scope, $rootScope, $location, $document, $window, $anchorScroll, $ngDialog, $Idle){
  $scope.allVoteCount = 0;
  $scope.gallery = function(imageUrl, message){
    var dialog = $ngDialog.open({
      template: 'views/gallery.html',
      scope: $scope,
      controller: function(){
        $scope.imageUrl = imageUrl;
        $scope.message = message;
      },
      preCloseCallback: function(value) {
        $location.$$absUrl = $rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol;
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
          $scope.$apply();
        }
      }
    });
    $rootScope.$on('ngDialog.closed', function (e, $dialog) {
      $rootScope.ngDiaglogFix.menubar = {right: '0px', 'padding-right': ''};
      $rootScope.ngDiaglogFix.shareButton = {right: '0px', 'padding-right': ''};
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
    });
    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
      $body = $document.find('body');
      var scrollBarYExist = $window.innerWidth<1017;
      if(!scrollBarYExist){
        $rootScope.ngDiaglogFix.menubar = {right: '0px', 'padding-right': $rootScope.scrollBarWidth/2 + 'px'};
        $rootScope.ngDiaglogFix.shareButton = {right: '0px', 'padding-right': $rootScope.scrollBarWidth + 'px'};
      }
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
    });
  };

  $Idle.watch();
  $scope.$on('IdleStart', function() {
    $window.location.reload();
  });

}])
app.controller('guestBook', ['$scope', '$rootScope', '$location', '$anchorScroll', function ($scope, $rootScope, $location, $anchorScroll){
  $scope.guestBooks = {
    'facebook': {
      select: $rootScope.configs.ipFrom == 'CN' ? false : true,
    },
    'weibo': {
      select: $rootScope.configs.ipFrom == 'CN' ? true : false,
    }
  };
  $scope.switchGuestBook = function(target){
    angular.forEach($scope.guestBooks, function(data, index){
      if(index == target){
        $scope.guestBooks[index]['select'] = true;
      }
      else{
        $scope.guestBooks[index]['select'] = false;
      }
    });
  };

}])
.controller('voteCtrl', ['$upload', '$scope', '$rootScope', '$window', '$document', '$location', '$anchorScroll', '$sce', '$routeParams', '$cookies', '$http', '$timeout', 'ngDialog', 'DoubleClick', 'isetVoteBackEnd', 'Facebook', 'Weibo', 'functions', function ($upload, $scope, $rootScope, $window, $document, $location, $anchorScroll, $sce, $routeParams, $cookies, $http, $timeout, $ngDialog, $DoubleClick,$isetVoteBackEnd, $Facebook, $Weibo, $functions){

  $scope.adCount = 0;
  $rootScope.socialStatus = '';
  $rootScope.userData = {
    type: $rootScope.configs.ipFrom == 'CN' ? 'weibo' : 'facebook',
    auth: {}
  };
  $rootScope.allVoteCount = '';
  $scope.uploadObjects = [];
  $scope.allVoteData = {};
  $scope.voteData = [];
  $scope.listSortType = 0;
  $scope.listSortTypes = [
    {field: 'createdTime', reverse: false},
    {field: 'createdTime', reverse: true},
    {field: 'votes', reverse: true},
    {field: 'votes', reverse: false},
  ];
  $scope.voteList = {
    nowCategoryIndex: 0,
    pageIndex: 0
  };
  $scope.voting = false;
  $scope.previewImage = {
    src : '',
    display: false
  };
  $scope.joining = {
    startButton: true,
    uploadField: false
  };
  $scope.userUploadResult = {
    status: ''
  };

  var refreshVote = function(userData, callback){
    var userData = typeof userData === 'undefined' || userData === '' ? {} : userData;
    $isetVoteBackEnd.getVoteObject(userData).success(function(response){
      sa('557fe70fee29d',{
       title: document.title,
       userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
      });
      //$scope.voteData = [];
      /*reset allVoteCount*/
      $rootScope.allVoteCount = 0;
      var ad = 0;
      angular.forEach(response.data, function(groupData, groupIndex){
        if(typeof $scope.voteData[groupIndex] === 'undefined'){
          $scope.voteData[groupIndex] = {
            objects: []
          };
        }
        angular.forEach(groupData, function(data, field){
          switch(field){
            case 'listId':
            case 'listName':
            case 'upload':
            case 'vote':
            case 'voteDisplay':
            case 'uploadMessage':
            case 'captcha':
              $scope.voteData[groupIndex][field] = data;
              break;
          }
        });
        var objects = [];
        angular.forEach(groupData.data, function(object, objectIndex){
          var patterns = {
            youtube: /.*\.youtube$/g,
            ad: /.*\.ad$/g
          };
          //var youtubeRegex = /.*\.youtube$/g;
          var type = '';
          object.listId = typeof groupData.listId !== 'undefined' ? groupData.listId : '';
          object.votes = parseInt(object.votes, 10);
          object.num = parseInt(object.num, 10);
          object.introduction = $sce.trustAsHtml(object.introduction);
          angular.forEach(patterns, function(pattern, index){
            if(pattern.test(object.fileName) || pattern.test(object.id)){
              type = index;
            }
          });
          switch(type){
            case 'youtube':
              object.type = 'youtube';
              object.src = {
                image: $sce.trustAsResourceUrl('http://img.youtube.com/vi/' + object.fileName.replace('.youtube', '') + '/mqdefault.jpg'),
                video: $sce.trustAsResourceUrl('http://www.youtube.com/embed/' + object.fileName.replace('.youtube', '') + '?fs=1')
              };
	      if($rootScope.configs.spaceId === '78'){
		object.src = {
                  image: $sce.trustAsResourceUrl($rootScope.configs.baseUrl + 'worldgym/images/' + object.fileName.replace('.youtube', '') + '.jpg'),
                  video: $sce.trustAsResourceUrl('http://www.youtube.com/embed/' + object.fileName.replace('.youtube', '') + '?fs=1')
                };
	      }
              break;
            case 'ad':
              object.type = 'ad';
              break;
            default:
              object.type = 'image';
              object.src = {
                m: $rootScope.configs.baseUrlforImage + 'm/' + object.fileName,
                l: $rootScope.configs.baseUrlforImage + 'l/' + object.fileName
              }
              //object.src = $rootScope.configs.baseUrlforImage + 'm/' + object.fileName;
          }

          object.vote = $scope.voteData[groupIndex]['vote'];
          object.voteDisplay = $scope.voteData[groupIndex]['voteDisplay'];
          if(typeof $scope.allVoteData[object.md5] === 'undefined'){
            $scope.allVoteData[object.md5] = object;
          }
          else{
            angular.forEach(object, function(value, field){
              if(typeof $scope.allVoteData[object.md5][field] == 'undefined' || $scope.allVoteData[object.md5][field] != value){
                $scope.allVoteData[object.md5][field] = value;
              }
            });
          }

          objects.push({
            object: object.md5,
            votes: object.votes,
            createdTime: object.createdTime
          });

          /* sum of all votes*/
          if(object.type !== 'ad'){
            if($rootScope.configs.eventType != 1){
              $rootScope.allVoteCount += object.votes;
            }
            else{
              $rootScope.allVoteCount++;
            }
          }
        });
        if($scope.voteData[groupIndex].objects.length<=0){
          $scope.voteData[groupIndex].objects = objects;
        }
        else{
          angular.forEach(objects, function(object, index){
            if(typeof $scope.voteData[groupIndex].objects[index] !== 'undefined'){
              angular.forEach(object, function(value, field){
                $scope.voteData[groupIndex].objects[index][field]  = value;
              });
            }
            else{
              $scope.voteData[groupIndex].push(object);
            }
          });
        }
        if(typeof $rootScope.pagination.page[groupIndex] === 'undefined'){
          $rootScope.pagination.page[groupIndex] = 0;
        }
      });
      //$scope.adNum = 1;
      if(typeof callback === 'function'){
        callback();
      }
    });

  };
  $scope.getAdsBetweenRange = function(start, end){
    if($rootScope.configs.ad != 1){
      return 0;
    }
    var count = 0;
    // for(var i = start; i<end; i++){
    //   if((i-3)%8==0){
    //     count ++;
    //   }
    // }
    return count;
  };
  $scope.getStartFrom = function(originalPosition){
    if($rootScope.configs.ad != 1){
      return originalPosition;
    }
    var count = 0;

    // for(var i = 0; i<originalPosition; i++){
    //   if((i-3)%8==0){
    //     count ++;
    //   }
    // }
    return originalPosition-count;
  };

  $scope.usingFlash = FileAPI && FileAPI.upload != null;
	$scope.fileReaderSupported = window.FileReader != null && (window.FileAPI == null || FileAPI.html5 != false);
	$scope.uploadRightAway = true;
	$scope.hasUploader = function(index) {
		return $scope.upload[index] != null;
	};
	$scope.abort = function(index) {
		$scope.upload[index].abort();
		$scope.upload[index] = null;
	};

  $scope.onFileSelect = function($files) {
    //console.log($files);
		$scope.selectedFiles = [];
		$scope.progress = [];
		if ($scope.upload && $scope.upload.length > 0) {
			for (var i = 0; i < $scope.upload.length; i++) {
				if ($scope.upload[i] != null) {
					$scope.upload[i].abort();
				}
			}
		}
		$scope.upload = [];
		$scope.uploadResult = [];
		$scope.selectedFiles = $files;
		$scope.dataUrls = [];
		for ( var i = 0; i < $files.length; i++) {
			var $file = $files[i];
			if ($scope.fileReaderSupported && $file.type.indexOf('image') > -1) {
				var fileReader = new FileReader();
				fileReader.readAsDataURL($files[i]);
				var loadFile = function(fileReader, index) {
					fileReader.onload = function(e) {
						$timeout(function() {
							$scope.dataUrls[index] = e.target.result;
						});
					}
				}(fileReader, i);
			}
			$scope.progress[i] = -1;
			if ($scope.uploadRightAway) {
				$scope.start(i);
			}
		}
	};

  $scope.start = function(index) {
		$scope.progress[index] = 0;
		$scope.errorMsg = null;

    $scope.upload[index] = $isetVoteBackEnd.uploadImage($scope.selectedFiles[index]);
		$scope.upload[index].then(function(response) {
			$timeout(function() {
				//$scope.uploadResult.push(response.data);
				//console.log(response.data.code);
				if(response.data.code === '1007'){
  				$scope.previewImage['src'] = 'http://event.setn.com/webEventBackend/attachment/temp/' + response.data.data.TempfileName;
  				$scope.uploadedImage = response.data.data.TempfileName;
  				$scope.previewImage.display = true;
  				//$scope.previewImage.class = 'auto-fixed-image';
  				//console.log($scope.previewUpload);
				}
			});
		}, function(response) {
			if(response.status > 0){
			  $scope.errorMsg = response.status + ': ' + response.data;
			}
		}, function(evt) {
			// Math.min is to fix IE which reports 200% sometimes
			$scope.progress[index] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		});

		$scope.upload[index].xhr(function(xhr){
		  xhr.upload.addEventListener('abort', function() {console.log('abort complete')}, false);
		});
	};

	$scope.postVoteObject = function(){
    var listId = $scope.voteData[$scope.voteList.nowCategoryIndex].listId;
    if(typeof $scope.policy !== 'undefined' && $scope.policy === true){
      if(typeof $scope.uploadedImage === 'undefined' || $scope.uploadedImage === ''){
        $window.alert('尚未上傳照片，請先選擇照片並上傳。');
        return false;
      }
      if(typeof $scope.voteObjectIntruduction === 'undefined' || $scope.voteObjectIntruduction === ''){
        $window.alert('請輸入說明文字。');
        return false;
      }

      $isetVoteBackEnd.postVoteObject($rootScope.userData, listId, $scope.uploadedImage, $scope.voteObjectIntruduction).success(function(response){
        $scope.userUploadResult.status = true;
        $scope.joining.uploadField = false;
        $scope.userUploadResult.sn = $functions.splitNumberAndPadLeft(response.data.num+1, 6);
        $scope.voteObjectIntruduction = '';
        $scope.uploadedImage = '';
        $scope.policy = '';
        $scope.previewImage.src = '';
        $scope.previewImage.display = false;
        //refreshVote({type: $rootScope.userData.type, userId: $rootScope.userData.auth.userId});
        $window.alert(response.message);
        sa('557fe70fee29d',{
          title: document.title,
          event: 'user upload completed',
          userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
        });
      })
      .error(function(response){
        $window.alert(response.message);
        sa('557fe70fee29d',{
          title: document.title,
          event: 'user upload failed',
          userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
        });
      });

    }
    else{
      $window.alert('請確認勾選同意說明文字下方的注意事項，才可上傳照片。');
    }
	};
	$scope.skipShare = function(){
  	$scope.userUploadResult.status = false;
  	$scope.resetJoin();
    sa('557fe70fee29d',{
      title: document.title,
      event: 'skip share'
    });
	};

  $scope.switchCategory = function(categoryIndex){
    if(typeof $scope.voteData[categoryIndex] !== 'undefined'){
      $scope.voteList.nowCategoryIndex = categoryIndex;
      $scope.voteList.pageIndex = 0;
      $location.$$absUrl = $rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol + '/' + categoryIndex;
    }
    sa('557fe70fee29d',{
      title: document.title,
      event: 'switch category',
      listId: $scope.voteData[categoryIndex].listName,
      userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
    });
    $scope.resetJoin();
    $timeout(function(){
      $scope.refreshAd();
      //$DoubleClick.refreshAds('dfp-desktop-0');
    }, 500);
  };
  $scope.switchPage = function(pageIndex){
    $rootScope.pagination.page[$scope.voteList.nowCategoryIndex] = pageIndex;
    $timeout(function(){
      $scope.refreshAd();
      //$DoubleClick.refreshAds('dfp-desktop-0');
    }, 500);
  };
  $scope.refreshAd = function(){
    if(typeof $rootScope.configs.ads === 'object'){
      angular.forEach($rootScope.configs.ads, function(ad){
        $DoubleClick.refreshAds(ad.id);
      });
    }
    // if(typeof $rootScope.configs.defaultAd === 'object'){
    //   $DoubleClick.refreshAds($rootScope.configs.defaultAd.id);
    // }
  };
  $scope.getUserData = function(callback){
    switch($rootScope.configs.ipFrom){
      case 'CN':
        if(typeof $rootScope.userData.auth.access_token === 'undefined'){
          $Weibo.checkLoginState(function(){
            $Weibo.getUser(function(auth){
              $rootScope.userData.auth.userId = auth.uid;
              //$rootScope.userData.type = 'weibo';
              var cookiesData = $functions.queryStringToObject($cookies['weibojs_' + $rootScope.configs.WBKey]);
              $rootScope.userData.auth.access_token = cookiesData.access_token;
              /*
$Weibo.getUserEmail(function(response){
                if(typeof response.email !== 'undefined'){
                  $rootScope.userData.email = response.email;
                }
              });
*/
              $Weibo.getUserData(auth.uid, function(response){
                for(field in response){
                  $rootScope.userData[field] = response[field];
                }
                if(typeof callback === 'function'){
                  callback();
                }
              });
            });
          }, function(){
            $window.alert('連接微博發生問題，如重複發生請聯絡我們進行處理。');
          });
        }
        else{
          if(typeof callback === 'function'){
            callback();
          }
        }
        break;
      default:
        if( typeof $rootScope.userData.auth.access_token === 'undefined' || $rootScope.userData.auth.access_token == '' ||
            typeof $rootScope.userData.email === 'undefined'){
          $Facebook.checkLoginState(function(){
            var auth = $Facebook.getAuthResponse();
            $rootScope.userData.auth.userId = auth.userID;
            $rootScope.userData.auth.access_token = auth.accessToken;
            //$rootScope.userData.type = 'facebook';
            FB.api('/me', function(response){
              for(field in response){
                $rootScope.userData[field] = response[field];
              }
              if(typeof callback === 'function'){
                callback();
              }
            });
          }, function(){
            $window.alert('參加本活動，需同意Facebook授權');
            location.href=$rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol;
            //$window.alert('連接 Facebook 發生問題，如重複發生請聯絡我們進行處理。');
          });
        }
        else{
          FB.api('/me', function(response){
            for(field in response){
              $rootScope.userData[field] = response[field];
            }
            if(typeof callback === 'function'){
              callback();
            }
          });
        }
        //console.log($rootScope.userData);
    }
  };

  $scope.resetJoin = function(){
    $scope.joining.startButton = true;
    $scope.joining.uploadField = false;
    $scope.userUploadResult.status = false;
  };
  $scope.join = function(){
    if($scope.voteData[$scope.voteList.nowCategoryIndex].upload){
      if($scope.joining.startButton){
        $scope.userUploadResult.status = false;
        $scope.getUserData(function(){
          $scope.joining.startButton = false;
          $scope.joining.uploadField = true;
          //console.log($rootScope.userData);
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
          }
        });
      }
      else{
        $scope.joining.uploadField = false;
        //$scope.joining.startButton = true;
        $('#update_step1').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
          $scope.joining.startButton = true;
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
          }
        });
      }
    }
    else{
      if(typeof $scope.voteData[$scope.voteList.nowCategoryIndex].uploadMessage === 'string'){
        window.alert($scope.voteData[$scope.voteList.nowCategoryIndex].uploadMessage);
      }
      //window.alert('您已達到上傳上限。');
    }
  }
  $scope.gymSkip = function(){
    $("#modal-2").prop("checked",false);
  }
  $scope.gymSubmit = function(){
    if(!$('#agree')[0].checked){ 
        console.log('agree not check');
	return ;
    }
    var postData = {
	user_id : $rootScope.userData.auth.userId,
	user_name : $('input[name="name"]').val(),
	gender : $('input[list="gender"]').val(),
	tel : $('input[name="tel"]').val(),
	email : $('input[name="email"]').val(),
	city_code : $('select[name="city"]').val(),
	district_code : $('select[name="district"]').val()
    };
    $isetVoteBackEnd.gymSubmit(postData).success(function(response){
        $("#modal-2").prop("checked",false);
	$("#form_gym")[0].reset();
	window.alert(response.message);
    });
  }
  $scope.checkGym = function(){
    //  window.alert('checking');
    $scope.getUserData(function(){
      $isetVoteBackEnd.checkGym($rootScope.userData).success(function(response){
	if(response.code == '1044'){
  	  console.log('1044');
	//console.log($('#colorbox_btn'));
	//$(".ajax").colorbox({width:"80%", height:"80%"});
	//$('#colorbox_btn').click();
	  $("#modal-2").prop("checked",true);
	} else {
	  window.alert(response.message);
	}
      });
    });
  }
  $scope.voteIt = function(listId, voteId, objectId){
    //console.log($scope.allVoteData[objectId]);
    if($scope.voting){
      //window.alert('上一筆投票處理中，請等待處理完成後再投下一票...');
    }
    else{
      sa('557fe70fee29d',{
        title: document.title,
        event: 'try to vote',
        userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
      });
      $scope.voting = true;
      $scope.validateKey = '';
      $scope.getUserData(function(){
        console.log('vote');
        if($scope.voteData[$scope.voteList.nowCategoryIndex].captcha){
          var dialog = $ngDialog.open({
            id: 'recaptchaDialog',
            template: $rootScope.configs.baseUrl + 'views/dialog.html?v=1',
            scope: $scope,
            controller: function(){
              $scope.valid = false;
              $scope.setResponse = function(response){
                $scope.valid = true;
                $scope.validateKey = response;
              };
              $scope.sendVote = function(){
                $isetVoteBackEnd.postVote($rootScope.userData, $rootScope.configs.spaceId, $scope.allVoteData[objectId].listId, voteId, $scope.validateKey).success(function(response){
                  window.alert(response.message);
                  $ngDialog.close('recaptchaDialog');
                  $scope.allVoteData[objectId].votes++;
                  $rootScope.allVoteCount++;
                  $scope.allVoteData[objectId].voted = true;
                  //refreshVote({type: $rootScope.userData.type, userId: $rootScope.userData.auth.userId});
                  $scope.sending = false;
                  sa('557fe70fee29d',{
                    title: document.title,
                    event: 'vote completed',
                    listId: listId,
                    voteId: voteId,
                    userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
                  });
                  ga('create', 'UA-37193510-14', 'auto', {"name" : "iwalker"});
                  ga('iwalker.send', 'pageview');
                  ga('setnews.send', 'pageview');
                  ga('send', 'pageview');
                })
                .error(function(response){
                  window.alert(response.message);
                  $ngDialog.close('recaptchaDialog');
                  $scope.sending = false;
                  sa('557fe70fee29d',{
                    title: document.title,
                    event: 'vote failed',
                    listId: listId,
                    voteId: voteId,
                    message: response.message,
                    userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
                  });
                });
              };
              sa('557fe70fee29d',{
                title: document.title,
                event: 'start recaptcha',
                voteId: voteId,
                userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
              });
            },
            preCloseCallback: function(value) {
              $scope.voting = false;
              if($rootScope.configs.device === 'mobile'){
                $timeout(function(){
                  //console.log(objectId);
                  $document.scrollTop($('#'+objectId)[0].offsetTop-60, 1000);
                }, 1000);
              }
              $location.$$absUrl = $rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol;
              if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
              }
              sa('557fe70fee29d',{
                title: document.title,
                event: 'close dialog',
                voteId: $scope.voteObjectId,
                userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
              });
            }
          });
        }
        else{
          if(true){
            $isetVoteBackEnd.postVote($rootScope.userData, $rootScope.configs.spaceId, $scope.allVoteData[objectId].listId, voteId).success(function(response){
              //window.alert(response.message);
              //refreshVote({type: $rootScope.userData.type, userId: $rootScope.userData.auth.userId});
              $scope.allVoteData[objectId].votes++;
              $rootScope.allVoteCount++;
              $scope.allVoteData[objectId].voted = true;
              $scope.voting = false;
              sa('557fe70fee29d',{
                title: document.title,
                event: 'vote completed',
                listId: listId,
                voteId: voteId,
                userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
              });
              ga('create', 'UA-37193510-14', 'auto', {"name" : "iwalker"});
              ga('iwalker.send', 'pageview');
              ga('setnews.send', 'pageview');
              ga('send', 'pageview');
            })
            .error(function(response){
              window.alert(response.message);
              $scope.voting = false;
              sa('557fe70fee29d',{
                title: document.title,
                event: 'vote failed',
                listId: listId,
                voteId: voteId,
                message: response.message,
                userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
              });
            });
          }
          else{
            $scope.voting = false;
          }
        }
      });
    }
  };
  $scope.showIt = function(voteObjectId, isUserUpload){
    //$rootScope.ngDiaglogFix = {right: '0px', 'padding-right':widthDiffs + 'px'};
		//var scrollBarWidth = widthDiffs - ($window.innerWidth - $body.prop('clientWidth'));
    //var originalBodyPadding = parseInt(($body.css('padding-right') || 0), 10);
    var template = isUserUpload !== 'undefined' && isUserUpload ? 'views/profile_userUpload.html' : 'views/profile.html';
    var dialog = $ngDialog.open({
      template: $rootScope.configs.baseUrl + template, //'views/profile.html?v=1',
      scope: $scope,
      controller: function(){
        $scope.viewPath = $rootScope.configs.baseUrl;
        $scope.voteObjectId = voteObjectId;
        $scope.baseUrlforImage = $rootScope.configs.baseUrlforImage;
        $location.$$absUrl = $rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol + '/' +voteObjectId;
        sa('557fe70fee29d',{
          title: document.title,
          event: 'open dialog',
          voteId: voteObjectId,
          userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
        });
      },
      preCloseCallback: function(value) {
        $location.$$absUrl = $rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol;
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
          $scope.$apply();
        }
        sa('557fe70fee29d',{
          title: document.title,
          event: 'close dialog',
          voteId: $scope.voteObjectId,
          userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
        });
      }
    });
    $rootScope.$on('ngDialog.closed', function (e, $dialog) {
      $rootScope.ngDiaglogFix.menubar = {right: '0px', 'padding-right': ''};
      $rootScope.ngDiaglogFix.shareButton = {right: '0px', 'padding-right': ''};
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
    });
    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
      $body = $document.find('body');
      var scrollBarYExist = $window.innerWidth<1017;
      if(!scrollBarYExist){
        $rootScope.ngDiaglogFix.menubar = {right: '0px', 'padding-right': $rootScope.scrollBarWidth/2 + 'px'};
        $rootScope.ngDiaglogFix.shareButton = {right: '0px', 'padding-right': $rootScope.scrollBarWidth + 'px'};
      }
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
    });
  };

  //preload vote object for init
  refreshVote('', function(){
    /* setting default category index on init */
    if(typeof $rootScope.configs.defaultCategoryIndex !== 'undefined' &&
      typeof $scope.voteData[$rootScope.configs.defaultCategoryIndex] !== 'undefined'
    ){
      $scope.voteList.nowCategoryIndex = $rootScope.configs.defaultCategoryIndex;
    }
    $scope.openIt();
  });

  $scope.openIt = function(){
    //console.log($rootScope.configs);
    //console.log($location.$$absUrl);
    var path = $location.$$absUrl.replace($rootScope.configs.baseUrl + $rootScope.configs.spaceSymbol, '');
    //console.log(path);
    if(path!= ''){
      path = path.substring(1);
      angular.forEach($scope.allVoteData, function(data, index){
        if(path === index){
          console.log($scope.voteData);

          $scope.showIt(index, $rootScope.configs.eventType==1);
        }
        else{
          //console.log(path);
          //console.log(index);
        }
      });
      if(typeof $scope.voteData[path] !== 'undefined'){
        $scope.voteList.nowCategoryIndex = path;
        $document.scrollTop($('#join')[0].offsetTop-60, 1000);
      }
    }
  }

  //console.log($location.path());
  //check user facebook or weibo login status if get the userID refresh to showing voted status of button
  switch($rootScope.configs.ipFrom){
    case 'CN':
      $Weibo.checkLoginState(function(){
        $Weibo.getUser(function(auth){
          $rootScope.userData.auth.userId = auth.uid;
          $rootScope.userData.type = 'weibo';
          refreshVote({type: $rootScope.userData.type, userId: $rootScope.userData.auth.userId}, function(){
            if(typeof $rootScope.configs.defaultCategoryIndex !== 'undefined' &&
              typeof $scope.voteData[$rootScope.configs.defaultCategoryIndex] !== 'undefined'
            ){
              $scope.voteList.nowCategoryIndex = $rootScope.configs.defaultCategoryIndex;
            }
            //$scope.openIt();
          });
        });
      },function(){},
      false);
      break;
    default:
      $scope.$watch('facebookKey', function(){
        //window.fbAsyncInit = function() {
          FB.init({
            appId      : $rootScope.configs.FBKey,
            xfbml      : false,
            version    : 'v2.1'
          });
          console.log('init');
          $timeout(function(){FB.XFBML.parse();}, 500);

          $Facebook.checkLoginState(function(){
            var auth = $Facebook.getAuthResponse();
            $rootScope.userData.auth.userId = auth.userID;
            $rootScope.userData.type = 'facebook';
            $rootScope.userData.auth.access_token = auth.accessToken;
            sa('557fe70fee29d',{
              title: document.title,
              event: 'user facebook logined',
              userId: typeof $rootScope.userData.auth.userId !== 'undefined' ? $rootScope.userData.auth.userId : 'null'
            });
            refreshVote({type: $rootScope.userData.type, userId: $rootScope.userData.auth.userId}, function(){
              //if(typeof $rootScope.configs.defaultCategoryIndex !== 'undefined' &&
              //  typeof $scope.voteData[$rootScope.configs.defaultCategoryIndex] !== 'undefined'
              //){
              //  $scope.voteList.nowCategoryIndex = $rootScope.configs.defaultCategoryIndex;
              //}
              //$scope.openIt();
            });
          },function(){}, false);
       // };
      });
  }
}]);
