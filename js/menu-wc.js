'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">schulcloud-server documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                        <li class="link">
                            <a href="todo.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>TODO
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#additional-pages"'
                            : 'data-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Additional documentation</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/nestjs-application.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-8059e9cef64a8ad4617a0e65f3aa663f"' : 'data-target="#xs-additional-page-8059e9cef64a8ad4617a0e65f3aa663f"' }>
                                                <span class="link-name">NestJS Application</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-8059e9cef64a8ad4617a0e65f3aa663f"' : 'id="xs-additional-page-8059e9cef64a8ad4617a0e65f3aa663f"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/software-architecture.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Software Architecture</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/architecture-mapping-to-code.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Architecture Mapping to Code</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/domain-driven-design.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Domain driven design</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/cross-cutting-concerns.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Cross-cutting concerns</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/testing.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Testing</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/decisions.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Decisions</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/vscode.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">VSCode</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/git.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Git</a>
                                            </li>
                                        </ul>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link">AuthModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthModule-8f179e63f0c7c9c43059488d215697e4"' : 'data-target="#xs-injectables-links-module-AuthModule-8f179e63f0c7c9c43059488d215697e4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-8f179e63f0c7c9c43059488d215697e4"' :
                                        'id="xs-injectables-links-module-AuthModule-8f179e63f0c7c9c43059488d215697e4"' }>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthorizationModule.html" data-type="entity-link">AuthorizationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthorizationModule-e1395ae179a656a6a263bc2698a5bc51"' : 'data-target="#xs-injectables-links-module-AuthorizationModule-e1395ae179a656a6a263bc2698a5bc51"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthorizationModule-e1395ae179a656a6a263bc2698a5bc51"' :
                                        'id="xs-injectables-links-module-AuthorizationModule-e1395ae179a656a6a263bc2698a5bc51"' }>
                                        <li class="link">
                                            <a href="injectables/AuthorizationService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AuthorizationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeathersAuthProvider.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>FeathersAuthProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link">CoreModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ErrorModule.html" data-type="entity-link">ErrorModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/FeathersModule.html" data-type="entity-link">FeathersModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-FeathersModule-d0e6855685938f9fa18af670e4efab18"' : 'data-target="#xs-injectables-links-module-FeathersModule-d0e6855685938f9fa18af670e4efab18"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FeathersModule-d0e6855685938f9fa18af670e4efab18"' :
                                        'id="xs-injectables-links-module-FeathersModule-d0e6855685938f9fa18af670e4efab18"' }>
                                        <li class="link">
                                            <a href="injectables/FeathersServiceProvider.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>FeathersServiceProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/InterceptorModule.html" data-type="entity-link">InterceptorModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/LoggerModule.html" data-type="entity-link">LoggerModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-LoggerModule-8ba8d456b47ff5c9286092ab4518db2a"' : 'data-target="#xs-injectables-links-module-LoggerModule-8ba8d456b47ff5c9286092ab4518db2a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LoggerModule-8ba8d456b47ff5c9286092ab4518db2a"' :
                                        'id="xs-injectables-links-module-LoggerModule-8ba8d456b47ff5c9286092ab4518db2a"' }>
                                        <li class="link">
                                            <a href="injectables/Logger.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>Logger</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MongoMemoryDatabaseModule.html" data-type="entity-link">MongoMemoryDatabaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NewsModule.html" data-type="entity-link">NewsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-NewsModule-d0bd9b157e547e701749ca7c635376ba"' : 'data-target="#xs-injectables-links-module-NewsModule-d0bd9b157e547e701749ca7c635376ba"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NewsModule-d0bd9b157e547e701749ca7c635376ba"' :
                                        'id="xs-injectables-links-module-NewsModule-d0bd9b157e547e701749ca7c635376ba"' }>
                                        <li class="link">
                                            <a href="injectables/NewsRepo.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>NewsRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NewsUc.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>NewsUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ServerModule.html" data-type="entity-link">ServerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' : 'data-target="#xs-controllers-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' :
                                            'id="xs-controllers-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' }>
                                            <li class="link">
                                                <a href="controllers/ServerController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ServerController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' : 'data-target="#xs-injectables-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' :
                                        'id="xs-injectables-links-module-ServerModule-3844b6670ab2235f17b798cf188b1276"' }>
                                        <li class="link">
                                            <a href="injectables/ServerService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ServerService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TaskModule.html" data-type="entity-link">TaskModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' : 'data-target="#xs-controllers-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' :
                                            'id="xs-controllers-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' }>
                                            <li class="link">
                                                <a href="controllers/TaskController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TaskController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' : 'data-target="#xs-injectables-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' :
                                        'id="xs-injectables-links-module-TaskModule-44fb09518cf99b36f0a8bc3fa8811340"' }>
                                        <li class="link">
                                            <a href="injectables/TaskRepo.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>TaskRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskUC.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>TaskUC</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ValidationModule.html" data-type="entity-link">ValidationModule</a>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#controllers-links"' :
                                'data-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/NewsController.html" data-type="entity-link">NewsController</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ApiValidationError.html" data-type="entity-link">ApiValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiValidationErrorResponse.html" data-type="entity-link">ApiValidationErrorResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthEntity.html" data-type="entity-link">AuthEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseEntity.html" data-type="entity-link">BaseEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseEntityWithTimestamps.html" data-type="entity-link">BaseEntityWithTimestamps</a>
                            </li>
                            <li class="link">
                                <a href="classes/BusinessError.html" data-type="entity-link">BusinessError</a>
                            </li>
                            <li class="link">
                                <a href="classes/Course.html" data-type="entity-link">Course</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseInfo.html" data-type="entity-link">CourseInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseNews.html" data-type="entity-link">CourseNews</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateNewsParams.html" data-type="entity-link">CreateNewsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorResponse.html" data-type="entity-link">ErrorResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/GlobalErrorFilter.html" data-type="entity-link">GlobalErrorFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/GlobalValidationPipe.html" data-type="entity-link">GlobalValidationPipe</a>
                            </li>
                            <li class="link">
                                <a href="classes/Lesson.html" data-type="entity-link">Lesson</a>
                            </li>
                            <li class="link">
                                <a href="classes/News.html" data-type="entity-link">News</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsFilterQuery.html" data-type="entity-link">NewsFilterQuery</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsMapper.html" data-type="entity-link">NewsMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsResponse.html" data-type="entity-link">NewsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsScope.html" data-type="entity-link">NewsScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationQuery.html" data-type="entity-link">PaginationQuery</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationResponse.html" data-type="entity-link">PaginationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SampleError.html" data-type="entity-link">SampleError</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInfo.html" data-type="entity-link">SchoolInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInfoMapper.html" data-type="entity-link">SchoolInfoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInfoResponse.html" data-type="entity-link">SchoolInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolNews.html" data-type="entity-link">SchoolNews</a>
                            </li>
                            <li class="link">
                                <a href="classes/Submission.html" data-type="entity-link">Submission</a>
                            </li>
                            <li class="link">
                                <a href="classes/Task.html" data-type="entity-link">Task</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskMapper.html" data-type="entity-link">TaskMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskResponse.html" data-type="entity-link">TaskResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamInfo.html" data-type="entity-link">TeamInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamNews.html" data-type="entity-link">TeamNews</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateNewsParams.html" data-type="entity-link">UpdateNewsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDTO.html" data-type="entity-link">UserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInfo.html" data-type="entity-link">UserInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInfoMapper.html" data-type="entity-link">UserInfoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInfoResponse.html" data-type="entity-link">UserInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationErrorDetailResponse.html" data-type="entity-link">ValidationErrorDetailResponse</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/DurationLoggingInterceptor.html" data-type="entity-link">DurationLoggingInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link">JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ParseObjectIdPipe.html" data-type="entity-link">ParseObjectIdPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TimeoutInterceptor.html" data-type="entity-link">TimeoutInterceptor</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/FeathersError.html" data-type="entity-link">FeathersError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeathersService.html" data-type="entity-link">FeathersService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICreateNews.html" data-type="entity-link">ICreateNews</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICurrentUser.html" data-type="entity-link">ICurrentUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IErrorType.html" data-type="entity-link">IErrorType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ILogger.html" data-type="entity-link">ILogger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/INewsProperties.html" data-type="entity-link">INewsProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/INewsScope.html" data-type="entity-link">INewsScope</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IPagination.html" data-type="entity-link">IPagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtConstants.html" data-type="entity-link">JwtConstants</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtPayload.html" data-type="entity-link">JwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsTargetFilter.html" data-type="entity-link">NewsTargetFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationModel.html" data-type="entity-link">PaginationModel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link">User</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});