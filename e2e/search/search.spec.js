'use strict';

//Todo: Related image search and notifications.
describe('Search View', function() 
{

    var page = require('./search.po'), 
    savedQueriesPage = require('./savedQueries.po'), 
    util = require('./dig.util');

    beforeEach(function() 
    {
        page.get();
    });

    it('should show results only after searching', function()
    {
        expect(page.isInListView()).toBeFalsy();
        page.search()
        .then(function ()
        {
             expect(page.isInListView()).toBeTruthy();
        });

    });

    it('should handle user input in the search bar', function()
    {
        page.setQuery('test').then(function ()
        {
            page.getCurrentQuery(function (ret)
            {
                expect(ret).toEqual('test');
            });
        }).then(page.clearQuery).then(function ()
        {
            page.getCurrentQuery(function (ret)
            {
                expect(ret).toEqual('');
            });
        });
    });

    //This test depends on data sets in English. All data sets in english should
    //function properly as the most common words in the english language are used
    //("the" and "be").
    it('should list the number results found on a search', function()
    {
        var resultCount = undefined;
        page.search()
        .then(page.getResultCount)
        .then(function (count)
        {
            //Results should be greater than 0
            resultCount = count;
            expect(resultCount).toBeGreaterThan(0);
            return page.searchFor('the');
        }).then(page.getResultCount)
        .then(function (count)
        {
            //Searching for 'the' should cut down on results
            expect(count).toBeLessThan(resultCount);
            resultCount = count;
            return page.searchFor('+the +be');
        }).then(page.getResultCount)
        .then(function (count)
        {
            //The intersection of 'the' and 'be' should be less than simply 'the'
            expect(count).toBeLessThan(resultCount);
            return page.searchFor('the be');
        }).then(page.getResultCount)
        .then(function (count)
        {
            //The union of 'the' and 'be' should be greater than just 'the'
            expect(count).toBeGreaterThan(resultCount);
        });
    });

    it('should be able to clear a search', function ()
    {
        page.searchFor('test')
        .then(function ()
        {
            expect(page.isInListView()).toBeTruthy();
            return page.clearSearch();
        }).then(function ()
        {
            expect(page.isInListView()).toBeFalsy(); 
        });

    });

    it('should only show a save button when there is an active search', function ()
    {
        page.isSaveButtonVisible()
        .then(expectFalse)
        .then(page.search)
        .then(page.isSaveButtonVisible)
        .then(expectTrue);
    });

    it('should show a save search Dialog', function ()
    {
        expect(page.isSaveDialogVisible()).toBeFalsy();
        page.searchAndOpenSave('');
        expect(page.isSaveDialogVisible()).toBeTruthy();
    });

    //A sleep was used to prevent the test from getting ahead of the browser
    it('should have a save Dialog that can be dismissed', function ()
    {
        page.searchAndOpenSave('')
        .then(page.isSaveDialogVisible)
        .then(function (visible)
        {
            browser.sleep(util.minimumSleepInterval * 2);
            expect(visible).toBeTruthy();
        }).then(page.cancelSave)
        .then(page.isSaveDialogVisible)
        .then(function (visible)
        {
            expect(visible).toBeFalsy();
        });
    });

    it('should only be able to saved named searches', function ()
    {
        page.searchAndOpenSave('');
        expect(page.isSaveButtonEnabled()).toBeFalsy();
        page.setQueryName('example');
        expect(page.isSaveButtonEnabled()).toBeTruthy();
    });

    it('should be able to save a new search', function ()
    {
        savedQueriesPage.get();
        savedQueriesPage.clearSavedSearches()
        .then(page.get)
        .then(function ()
        {
            return page.searchForAndSaveAs('test', 'query1');
        }).then(savedQueriesPage.get)
        .then(function ()
        {
            expect(savedQueriesPage.getSavedQueryCount()).toEqual(1);
            expect(savedQueriesPage.getQueryName(0)).toEqual('query1');
            expect(savedQueriesPage.getQueryTerms(0)).toEqual('test');
        });
    });

    //Like some other tests, a sleep had to be added to prevent the tests from
    //getting ahead of the browser.
    it('should be able to overwrite a previous search', function ()
    {
        savedQueriesPage.get();
        savedQueriesPage.clearSavedSearches()
        .then(page.get)
        .then(function ()
        {
            return page.searchForAndSaveAs('test1', 'query1');
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 4);
            return page.searchForAndSaveAs('test2', 'query1');
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 4);
            return browser.switchTo().alert().accept();
        }).then(savedQueriesPage.get)
        .then(function ()
        {
            expect(savedQueriesPage.getSavedQueryCount()).toEqual(1);
            expect(savedQueriesPage.getQueryName(0)).toEqual('query1');
            expect(savedQueriesPage.getQueryTerms(0)).toEqual('test2');
        });
    });

    it('should allow the user to cancel a save if it will overwrite an old one', function ()
    { 
        savedQueriesPage.get();
        savedQueriesPage.clearSavedSearches()
        .then(page.get)
        .then(function ()
        {
            return page.searchForAndSaveAs('test1', 'query1');
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 4);
            return page.searchForAndSaveAs('test2', 'query1');
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 4);
            return browser.switchTo().alert().dismiss();
        }).then(savedQueriesPage.get)
        .then(function ()
        {
            expect(savedQueriesPage.getSavedQueryCount()).toEqual(1);
            expect(savedQueriesPage.getQueryName(0)).toEqual('query1');
            expect(savedQueriesPage.getQueryTerms(0)).toEqual('test1');
        });
    });

    it('should let users select a previous query and overwrite it', function ()
    {
        savedQueriesPage.get();
        savedQueriesPage.clearSavedSearches()
        .then(page.get)
        .then(function ()
        {
            return page.searchForAndSaveAs('test1', 'query1');
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 4);
            return page.searchForAndSaveAsQueryNumber('test2', 0);
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 4);
            return browser.switchTo().alert().accept();
        }).then(savedQueriesPage.get)
        .then(function ()
        {
            expect(savedQueriesPage.getSavedQueryCount()).toEqual(1);
            expect(savedQueriesPage.getQueryName(0)).toEqual('query1');
            expect(savedQueriesPage.getQueryTerms(0)).toEqual('test2');
        });
    });

    it('should allow users to set a frequency of execution for a search', function ()
    {
        savedQueriesPage.get();
        savedQueriesPage.clearSavedSearches()
        .then(page.get)
        .then(function ()
        {
            return page.searchForAndSaveAs('test1', 'query1', savedQueriesPage.FREQUENCY_NEVER);
        }).then(function ()
        {
            return page.searchForAndSaveAs('test2', 'query2', savedQueriesPage.FREQUENCY_HOURLY);
        }).then(function ()
        {
            return page.searchForAndSaveAs('test3', 'query3', savedQueriesPage.FREQUENCY_DAILY);
        }).then(function ()
        {
            return page.searchForAndSaveAs('test4', 'query4', savedQueriesPage.FREQUENCY_WEEKLY);
        }).then(savedQueriesPage.get)
        .then(function ()
        {
            expect(savedQueriesPage.getQueryFrequency(0)).toEqual('never');
            expect(savedQueriesPage.getQueryFrequency(1)).toEqual('hourly');
            expect(savedQueriesPage.getQueryFrequency(2)).toEqual('daily');
            expect(savedQueriesPage.getQueryFrequency(3)).toEqual('weekly');
        });
    });
    
    //Sometimes (1/10 times roughly) the second result would not expand or collapse 
    //in time to pass the test. The sleeps were added to mitigate this but should
    //this test continue to fail sporadically, increasing the sleep time should
    //further reduce or completely stop the failures. 
    it('should allow users to expand and close results', function ()
    {
       page.search()
        .then(page.getResultsOnPage)
        .then(function (count)
        {
            for(var i = 0; i < (count/util.reductionDivisor) + 1; i++)
            {
                //Check to see they are all collapsed
                expect(page.isResultExpanded(i)).toBeFalsy();
            }

            return count;
        }).then(function (count)
        {
            for(var i = 0; i < (count/util.reductionDivisor) + 1; i++)
            {
                page.toggleResult(i);
                browser.sleep(util.minimumSleepInterval * 3);
            }

            return count;
        }).then(function (count)
        {
            for(var i = 0; i < (count/util.reductionDivisor) + 1; i++)
            {
                //Now check to see they have all correctly expanded
                expect(page.isResultExpanded(i)).toBeTruthy();
            }

            return page.toggleResult(0);
        }).then(function ()
        {
            //Try toggling just one and checking to see it collapses
            expect(page.isResultExpanded(0)).toBeFalsy();
            return page.toggleResult(0);
        }).then(function ()
        {
            //Then check to see it will expand again
            expect(page.isResultExpanded(0)).toBeTruthy();
        }).then(page.getResultsOnPage)
        .then(function (count)
        {
            for(var i = 0; i < (count/util.reductionDivisor) + 1; i++)
            {
                page.toggleResult(i);
                browser.sleep(util.minimumSleepInterval * 3);
            }

            return count;
        }).then(function (count)
        {
            for(var i = 0; i < (count/util.reductionDivisor) + 1; i++)
            {
                //After collapsing them all, check again to see they have collapsed
                expect(page.isResultExpanded(i)).toBeFalsy();
            }
        });
    });
    
    it('should be able to sort based on different parameters', function ()
    {   
        var firstResult = undefined;
        var firstDate = undefined, secondDate = undefined;
        page.search().then(function ()
        {
            return page.getTitle(0);
        }).then(function (title)
        {
            firstResult = title;
            //Date created newest first
            return page.sortBy(1);
        }).then(function ()
        {
            expect(page.getTitle(0)).not.toEqual(firstResult);
            page.getDateCreated(0).then(function (date)
            {
                firstDate = new Date(date);
            });
            page.getDateCreated(1).then(function (date)
            {
                secondDate = new Date(date);
            }).then(function ()
            {
                expect(firstDate).not.toBeLessThan(secondDate);
            });
            //Date created oldest first
            return page.sortBy(2);
        }).then(function ()
        {
            expect(page.getTitle(0)).not.toEqual(firstResult);
            page.getDateCreated(0).then(function (date)
            {
                firstDate = new Date(date);
            });
            page.getDateCreated(1).then(function (date)
            {
                secondDate = new Date(date);
            }).then(function ()
            {
                expect(firstDate).not.toBeGreaterThan(secondDate);
            });
        });
    });
    
    it('should sort in a repeatable nature', function ()
    {
        var results = [];

        page.searchFor('')
        .then(function ()
        {
            return page.getResultListOnPage();
        }).then(function (resultList)
        {
            results = resultList;
            return page.sortBy(2);
        }).then(function ()
        {
            return page.getResultListOnPage();
        }).then(function (resultList)
        {
            expect(resultList).not.toEqual(results);
            return page.sortBy(0);
        }).then(function ()
        {
            return page.getResultListOnPage();
        }).then(function (resultList)
        {
            expect(resultList).toEqual(results);
        });
    });

    it('should be able to display results grid and list views', function ()
    {
        page.search().then(function ()
        {
            expect(page.isInListView()).toBeTruthy();
            expect(page.isInGridView()).toBeFalsy();
        })
        .then(page.switchToGridView)
        .then(function ()
        {
            expect(page.isInListView()).toBeFalsy();
            expect(page.isInGridView()).toBeTruthy();
        }).then(page.switchToListView)
        .then(function ()
        {
            expect(page.isInListView()).toBeTruthy();
            expect(page.isInGridView()).toBeFalsy(); 
        });
    }); 

    it('should have a from date selector that can be opened and closed', function ()
    {
        page.search().then(function ()
        {
            expect(page.isFromCalendarOpen()).toBeFalsy();
            return page.toggleFromCalendar();
        }).then(function ()
        {
            expect(page.isFromCalendarOpen()).toBeTruthy();
            return page.toggleFromCalendar();
        }).then(function ()
        {
            expect(page.isFromCalendarOpen()).toBeFalsy();
            return page.toggleFromCalendar();
        }).then(function ()
        {
            return browser.actions().mouseMove({x: 100, y: 100}).doubleClick().perform();
        }).then(function ()
        {
            expect(page.isFromCalendarOpen()).toBeFalsy();
        });

    });

    it('should have a to date selector that can be opened and closed', function ()
    {
        page.search().then(function ()
        {
            expect(page.isToCalendarOpen()).toBeFalsy();
            return page.toggleToCalendar();
        }).then(function ()
        {
            expect(page.isToCalendarOpen()).toBeTruthy();
            return page.toggleToCalendar();
        }).then(function ()
        {
            expect(page.isToCalendarOpen()).toBeFalsy();
            return page.toggleToCalendar();
        }).then(function ()
        {
            return browser.actions().mouseMove({x: 100, y: 100}).doubleClick().perform();
        }).then(function ()
        {
            expect(page.isToCalendarOpen()).toBeFalsy();
        });

    });

    it('should have a from date calendar that allows switching view states', function ()
    {
        var day = undefined, month = undefined, year = undefined;
        page.search().then(function ()
        {
            return page.toggleFromCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInFromCalendar();
        }).then(function (option)
        {
            day = option;
            expect(page.getFromCalendarState()).toEqual('day');
            return page.goUpInFromCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInFromCalendar();
        }).then(function (option)
        {
            month = option;
            expect(page.getFromCalendarState()).toEqual('month');
            return page.goUpInFromCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInFromCalendar()
        }).then(function  (option)
        {
            year = option;
            expect(page.getFromCalendarState()).toEqual('year');
            return page.selectOptionInFromCalendar(year);
        }).then(function ()
        {
            expect(page.getFromCalendarState()).toEqual('month');
            return page.selectOptionInFromCalendar(month);
        }).then(function ()
        {
            expect(page.getFromCalendarState()).toEqual('day');
        });
    });

    it('should have a to date calendar that allows switching view states', function ()
    {
        var day = undefined, month = undefined, year = undefined;
        page.search().then(function ()
        {
            return page.toggleToCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInToCalendar();
        }).then(function (option)
        {
            day = option;
            expect(page.getToCalendarState()).toEqual('day');
            return page.goUpInToCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInToCalendar();
        }).then(function (option)
        {
            month = option;
            expect(page.getToCalendarState()).toEqual('month');
            return page.goUpInToCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInToCalendar()
        }).then(function  (option)
        {
            year = option;
            expect(page.getToCalendarState()).toEqual('year');
            return page.selectOptionInToCalendar(year);
        }).then(function ()
        {
            expect(page.getToCalendarState()).toEqual('month');
            return page.selectOptionInToCalendar(month);
        }).then(function ()
        {
            expect(page.getToCalendarState()).toEqual('day');
        });
    });

    it('should have a from calendar that allows users to select dates and updates properly', function ()
    {
        var day = undefined, month = undefined, year = undefined;
        var dayNumber = undefined, monthString = undefined, yearNumber = undefined;
        page.search().then(function ()
        {
            return page.toggleFromCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInFromCalendar();
        }).then(function (option)
        {
            day = option;
            return page.goUpInFromCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInFromCalendar();
        }).then(function (option)
        {
            month = option;
            return page.goUpInFromCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInFromCalendar()
        }).then(function  (option)
        {
            year = option;
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            yearNumber = util.getYearFromRange(title, year);
            expect(page.getOptionTextInFromCalendar(year)).toEqual(yearNumber.toString());
            return page.selectOptionInFromCalendar(year);
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            expect(title).toEqual(yearNumber.toString());
            monthString = util.getMonthName(month);
            expect(page.getOptionTextInFromCalendar(month)).toEqual(monthString);
            return page.selectOptionInFromCalendar(month);
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            expect(title).toEqual(monthString + ' ' + yearNumber);
        });
    });

    it('should have a to calendar that allows users to select dates and updates properly', function ()
    {
        var day = undefined, month = undefined, year = undefined;
        var dayNumber = undefined, monthString = undefined, yearNumber = undefined;
        page.search().then(function ()
        {
            return page.toggleToCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInToCalendar();
        }).then(function (option)
        {
            day = option;
            return page.goUpInToCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInToCalendar();
        }).then(function (option)
        {
            month = option;
            return page.goUpInToCalendar();
        }).then(function ()
        {
            return page.getSelectedOptionInToCalendar()
        }).then(function  (option)
        {
            year = option;
            return page.getToCalendarTitle();
        }).then(function (title)
        {
            yearNumber = util.getYearFromRange(title, year);
            expect(page.getOptionTextInToCalendar(year)).toEqual(yearNumber.toString());
            return page.selectOptionInToCalendar(year);
        }).then(function ()
        {
            return page.getToCalendarTitle();
        }).then(function (title)
        {
            expect(title).toEqual(yearNumber.toString());
            monthString = util.getMonthName(month);
            expect(page.getOptionTextInToCalendar(month)).toEqual(monthString);
            return page.selectOptionInToCalendar(month);
        }).then(function ()
        {
            return page.getToCalendarTitle();
        }).then(function (title)
        {
            expect(title).toEqual(monthString + ' ' + yearNumber);
        });
    });
    
    it('should highlight the current date in the from calendar', function ()
    {
        var today = new Date();
        page.search()
        .then(page.toggleFromCalendar)
        .then(function ()
        {
            return page.getHighlightedTextInFromCalendar();
        }).then(function (text)
        {
            expect(parseInt(text)).toEqual(today.getDate());
            return page.goUpInFromCalendar();
        }).then(function ()
        {
            return page.getHighlightedTextInFromCalendar();
        }).then(function (text)
        {
            expect(text).toEqual(util.getMonthName(today.getMonth()));
            return page.goUpInFromCalendar();
        }).then(function ()
        {
            return page.getHighlightedTextInFromCalendar();
        }).then(function (text)
        {
            expect(parseInt(text)).toEqual(today.getFullYear());
        });
    });

    it('should highlight the current date in the to calendar', function ()
    {
        var today = new Date();
        page.search()
        .then(page.toggleToCalendar)
        .then(function ()
        {
            return page.getHighlightedTextInToCalendar();
        }).then(function (text)
        {
            expect(parseInt(text)).toEqual(today.getDate());
            return page.goUpInToCalendar();
        }).then(function ()
        {
            return page.getHighlightedTextInToCalendar();
        }).then(function (text)
        {
            expect(text).toEqual(util.getMonthName(today.getMonth()));
            return page.goUpInToCalendar();
        }).then(function ()
        {
            return page.getHighlightedTextInToCalendar();
        }).then(function (text)
        {
            expect(parseInt(text)).toEqual(today.getFullYear());
        });
    });
    
    it('should have the current day selected in the from calendar by default', function ()
    {
        var currentDate = new Date();
        page.search()
        .then(function ()
        {
            return page.toggleFromCalendar();
        }).then(function ()
        {
            return page.getSelectedDateInFromCalendar();
        }).then(function (date)
        {
            expect(date.getYear()).toEqual(currentDate.getYear());
            expect(date.getMonth()).toEqual(currentDate.getMonth());
            expect(date.getDate()).toEqual(currentDate.getDate());
        });
    });

    it('should have the current day selected in the to calendar by default', function ()
    {
        var currentDate = new Date();
        page.search()
        .then(function ()
        {
            return page.toggleToCalendar();
        }).then(function ()
        {
            return page.getSelectedDateInToCalendar();
        }).then(function (date)
        {
            expect(date.getYear()).toEqual(currentDate.getYear());
            expect(date.getMonth()).toEqual(currentDate.getMonth());
            expect(date.getDate()).toEqual(currentDate.getDate());
        });
    });

    it('should have functional cycling arrows in the from calendar', function ()
    {
        var date = undefined;
        var selectedTitle = undefined;
        page.search()
        .then(function ()
        {
            return page.toggleFromCalendar();
        //Check arrows in day state
        }).then(function ()
        {
            return page.getSelectedDateInFromCalendar();
        }).then(function (selectedDate)
        {
            date = selectedDate;
            return page.goToPreviousInFromCalendar();  
        }).then(function ()
        {
            return page.getSelectedDateInFromCalendar();
        }).then(function (selectedDate)
        {
            expect(selectedDate.getMonth()).toBeLessThan(date.getMonth());
            return page.goToNextInFromCalendar();
        }).then(function ()
        {
            return page.getSelectedDateInFromCalendar();
        }).then(function (selectedDate)
        {
            expect(selectedDate.getMonth()).toEqual(date.getMonth());
            return page.goUpInFromCalendar();

        //Check arrows in month state
        }).then(function ()
        {
            return page.getFromCalendarTitle()
        }).then(function (title)
        {
            selectedTitle = title;
            return page.goToPreviousInFromCalendar();
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            expect(title).not.toEqual(selectedTitle);
            return page.goToNextInFromCalendar();
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            expect(title).toEqual(selectedTitle);
            return page.goUpInFromCalendar();

        //Check arrows in year state
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            selectedTitle = title;
            return page.goToPreviousInFromCalendar();
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            expect(title).not.toEqual(selectedTitle);
            return page.goToNextInFromCalendar();
        }).then(function ()
        {
            return page.getFromCalendarTitle();
        }).then(function (title)
        {
            expect(title).toEqual(selectedTitle);
        });
    });
    
    //Todo: Remove commented out expects from this and following test when data set has
    //improved.

    //This test assumes the 3rd sort option is sorting by date created, oldest to newest
    it('should be able to filter out all results before a date', function ()
    {  
        var earliestDate = undefined, resultCount = undefined, resultList = undefined;
        page.search()
        .then(function ()
        {
            //Sort oldest to newest
            return page.sortBy(2);
        }).then(function ()
        {
            return page.getResultCount();
        }).then(function (count)
        {
            resultCount = count;
            return page.getResultListOnPage();
        }).then(function (list)
        {
            resultList = list;
        }).then(function ()
        {
            return page.getEarliestCreatedDate();
        })
        .then(function (date)
        {
            earliestDate = date;
            //Filter from the earliest date, should not affect results
            return page.filterFromDate(earliestDate);
        }).then(function ()
        {
            return page.getResultCount();
        }).then(function (count)
        {
            //expect(count).toEqual(resultCount);
            return page.getResultListOnPage();
        }).then(function (list)
        {
            //expect(list).toEqual(resultList);
            return page.getFilteredFromDate();
        }).then(function (dateString)
        {
            //Add one to the earliest day, this should decrease results by
            //at least one
            var fromDate = new Date(dateString);
            expect(fromDate.toDateString()).toEqual(earliestDate.toDateString());

            var date = new Date(earliestDate.getTime());
            date.setDate(date.getDate() + 1);
            return page.filterFromDate(date);
        }).then(function ()
        {
            return page.getDateCreated(0);
        }).then(function (date)
        {
            expect(new Date(date)).toBeGreaterThan(earliestDate);
            expect(page.getResultCount()).toBeLessThan(resultCount);
            expect(page.getResultListOnPage()).not.toEqual(resultList);
            return page.getFilteredFromDate();
        }).then(function (dateString)
        {
            var fromDate = new Date(dateString);
            var addedDate  = earliestDate;
            addedDate.setDate(addedDate.getDate() + 1)
            expect(fromDate.toDateString()).toEqual(addedDate.toDateString());
        });
    });

    //This test assumes the 2nd sort option is sorting by date created, newest to oldest
    it('should be able to filter out all results after a date', function ()
    {  
        var latestDate = undefined, resultCount = undefined, resultList = undefined;
        page.search()
        .then(function ()
        {
            //Sort newest to oldest
            return page.sortBy(1);
        }).then(function ()
        {
            return page.getResultCount();
        }).then(function (count)
        {
            //Get total results
            resultCount = count;
            return page.getResultListOnPage();
        }).then(function (list)
        {
            resultList = list;
        }).then(function ()
        {
            return page.getLatestCreatedDate();
        })
        .then(function (date)
        {

            latestDate = date;
            //Filter up to the latest date, should not affect results
            return page.filterToDate(latestDate);
        }).then(function ()
        {
            return page.getResultCount();
        }).then(function (count)
        {
            //expect(count).toEqual(resultCount);
            return page.getResultListOnPage();
        }).then(function (list)
        {
            //expect(list).toEqual(resultList);
            return page.getFilteredToDate();
        }).then(function (dateString)
        {   
            var toDate = new Date(dateString);
            expect(toDate.toDateString()).toEqual(latestDate.toDateString());
            //Subtract one from the latest day, this should decrease results by
            //at least one
            var date = new Date(latestDate.getTime());
            date.setDate(date.getDate() - 1);
            return page.filterToDate(date);
        }).then(function ()
        {
            return page.getDateCreated(0);
        }).then(function (date)
        {
            expect(new Date(date)).toBeLessThan(latestDate);
            expect(page.getResultCount()).toBeLessThan(resultCount);
            expect(page.getResultListOnPage()).not.toEqual(resultList);
            return page.getFilteredToDate();
        }).then(function (dateString)
        {
            var toDate = new Date(dateString);
            var subtractedDate = toDate;
            subtractedDate.setDate(subtractedDate.getDate() - 1);
            expect(toDate.toDateString()).toEqual(subtractedDate.toDateString());
        });
    });
    
    //This test does not actually test if the results after filtering all meet filter criteria.
    //It merely checks to see if filters predictably reduce/increase result counts as they are applied.
    //Adding a test to check if the filter is working correctly directly would cause it to be reliant on the
    //specific data set since filters are based off of the underlying data fields. Since this would cause the 
    //test to be nonfunctional for different data sets, direct testing of filters was omitted. However,
    //this might be able to be accomplished in a generic way and might be worth doing in the future.
    it('should allow filtering based on result attributes', function ()
    {
        var counts = [], attributeFilterCount = undefined, typeCounts = [];
        page.search()
        .then(page.getResultCount)
        .then(function (count)
        {
            counts.push(count);
            return page.getAttributeFilterCount()
        }).then(function (count)
        {
            attributeFilterCount = count;
            for(var i = 0; i < attributeFilterCount; i++)
            {
                page.getTypeCountOfAttributeFilter(i)
                .then(function (typeCount)
                {
                    typeCounts.push(typeCount);
                });
            }
        }).then(function ()
        {
            //Must skip the last filter type as all data in the current data set has 
            //null for it.
            for(var i = 0; i < attributeFilterCount - 1; i++)
            {
                for(var j = 0; j < Math.floor(((typeCounts[i])/util.reductionDivisor) + 1); j++)
                {
                    var func = (function ()
                    {
                        var k = j;
                        page.toggleFilterByAttribute(i, j)
                        .then(page.getResultCount)
                        .then(function (resultCount)
                        {
                            if(k === 0)
                            {
                                expect(resultCount).not.toBeGreaterThan(counts[counts.length - 1]);
                            }
                            else
                            {
                                expect(resultCount).toBeGreaterThan(counts[counts.length - 1]);
                            }
                            counts.push(resultCount);
                            browser.sleep(util.minimumSleepInterval * 2);
                        });  
                    });
                    func();   
                }
            }
        }).then(function ()
        {
            counts.pop();
            for(var i = attributeFilterCount - 2; i > -1; i--)
            {
                for(var j = Math.floor(((typeCounts[i])/util.reductionDivisor)); j > -1 ; j--)
                {
                    page.toggleFilterByAttribute(i, j)
                    .then(page.getResultCount)
                    .then(function (resultCount)
                    {
                        expect(resultCount).toEqual(counts.pop());
                        browser.sleep(util.minimumSleepInterval * 2);
                    });    
                }
            }

        });  
    });
    
    it('should list filter types ordered by the number of matching results', function ()
    {
        var attributeFilterCount = undefined, typeCounts = [];
        page.search()
        .then(function ()
        {
            return page.getAttributeFilterCount()
        }).then(function (count)
        {
            attributeFilterCount = count;
            for(var i = 0; i < attributeFilterCount; i++)
            {
                page.getTypeCountOfAttributeFilter(i)
                .then(function (typeCount)
                {
                    typeCounts.push(typeCount);
                });
            }
        }).then(function ()
        {
            //Must skip the last filter type as all data in the current data set has 
            //null for it.
            var currMatching = Number.MAX_VALUE;
            for(var i = 0; i < attributeFilterCount - 1; i++)
            {
                for(var j = 0; j < Math.floor(((typeCounts[i])/util.reductionDivisor) + 1); j++)
                {
                    var func = (function ()
                    {
                        var k = j;
                        page.getResultCountMatchingFilter(i, j)
                        .then(function (count)
                        {
                            if(k !== 0)
                            {
                                expect(count).not.toBeGreaterThan(currMatching);
                            }
                            currMatching = count;
                        });  
                    });
                    func();      
                }
            }
        });
    });

    it('should allow users to hide and show excess types under attribute filters', function ()
    {
       var attributeFilterCount = undefined, typeCounts = [];
        page.search()
        .then(function ()
        {
            return page.getAttributeFilterCount()
        }).then(function (count)
        {
            var currTypeCount = undefined;
            attributeFilterCount = count;
            for(var i = 0; i < attributeFilterCount; i++)
            {
                expandUntilFullyExpanded(i, 0);
                collapseUntilFullyCollapsed(i, 0);
            }
        });
    });
    
    it('should display search filters and allow their removal with breadcrumbs', function ()
    {
        var counts = [];
        var attributeFilterCount = undefined
        page.search().then(page.getResultCount)
        .then(function (count)
        {
            //counts[0] is the total number of results
            counts[0] = count;
        }).then(function ()
        {
            return page.getAttributeFilterCount();
        }).then(function (count)
        {
            attributeFilterCount = count;
        }).then(function ()
        {  
            //Testing data set has an empty last attribute filter
            //so it must be skipped
            for(var i = 0; i < attributeFilterCount - 1; i++)
            {
                page.toggleFilterByAttribute(i, 0)
                .then(page.getResultCount)
                .then(function (count)
                {
                    var j = counts.length - 1;
                    counts.push(count);
                    var filterAttribute = undefined, filterType = undefined, 
                    filter = undefined, breadCrumbText = undefined;

                    //The filter text should match the breadcrumb text
                    page.getAttributeFilter(j).then(function (name)
                    {
                        filterAttribute = name.toLowerCase();
                    });
                    page.getAttributeFilterType(j,0).then(function (name)
                    {
                        filterType = name.toLowerCase();
                    }).then(function ()
                    {
                        filter = filterAttribute + ": " + filterType;
                    }).then(function ()
                    {
                        browser.sleep(util.minimumSleepInterval * 2);
                        page.getAttributeBreadcrumbText(j,0).then(function (text)
                        {
                            breadCrumbText = text.toLowerCase();
                        });
                    }).then(function ()
                    {
                        expect(breadCrumbText).toEqual(filter);
                    });
                });
            }
        })
        //Check to see that removing filters using breadcrumbs works as expected
        .then(function ()
        {
            expect(page.getResultCount()).toEqual(counts.pop());
            for(var i = attributeFilterCount - 2; i >= 0; i--)
            {
                page.removeAttributeBreadcrumb(i, 0)
                .then(page.getResultCount)
                .then(function (count)
                {
                    expect(count).toEqual(counts.pop());
                });
            }
        //Check to make sure filtering by two types of the same attribute works
        }).then(function ()
        {
            page.toggleFilterByAttribute(0,0)
            .then(page.getResultCount)
            .then(function (count)
            {
                counts.push(count);
                return page.toggleFilterByAttribute(0,1);
            }).then(page.getResultCount)
            .then(function (count)
            {
                expect(count).toBeGreaterThan(counts[0]);
                return page.removeAttributeBreadcrumb(0,1);
            }).then(page.getResultCount)
            .then(function (count)
            {
                expect(count).toEqual(counts.pop());
                return page.removeAttributeBreadcrumb(0,0);
            });
        //Check to make sure filtering by dates works
        }).then(page.getResultCount)
        .then(function (count)
        {
            counts.push(count);
        })
        .then(function ()
        {
            return page.getEarliestCreatedDate();
        }).then(function (earliestDate)
        {
            earliestDate.setDate(earliestDate.getDate() + 1);
            return page.filterFromDate(earliestDate);
        }).then(page.getResultCount)
        .then(function (count)
        {
            var fromDate = undefined;
            expect(count).toBeLessThan(counts[0]);
            
            return page.getFilteredFromDate()
            .then(function (dateString)
            {
                fromDate = dateString;
            }).then(function ()
            {
                return page.getDateBreadcrumbText(0);
            }).then(function (text)
            {
                expect(text).toEqual('beginDate: ' + fromDate);
            }).then(function ()
            {
                return page.removeDateBreadcrumb(0);
            })
        }).then(page.getResultCount)
        .then(function (count)
        {
            expect(count).toEqual(counts[0]);
            return page.getLatestCreatedDate();
        }).then(function (latestDate)
        {
            latestDate.setDate(latestDate.getDate() - 1);
            return page.filterToDate(latestDate);
        }).then(page.getResultCount)
        .then(function (count)
        {
            //Date breadcrumbs work differently in that the to breadcrumb will
            //always be at index 1 even if there is no from breadcrumb.
            var toDate = undefined;
            expect(count).toBeLessThan(counts[0]);
            
            return page.getFilteredToDate()
            .then(function (dateString)
            {
                toDate = dateString;
            }).then(function ()
            {
                return page.getDateBreadcrumbText(1);
            }).then(function (text)
            {
                expect(text).toEqual('endDate: ' + toDate);
            }).then(function ()
            {
                return page.removeDateBreadcrumb(1);
            })
        }).then(page.getResultCount)
        .then(function (count)
        {
            expect(count).toEqual(counts[0]);
        });
    });
    
    //Sleeps were added because the expansions/collapses of filters were occurring
    //slower than the tests. The time can be increased if the test sporadically fails
    it('should allow the collapsing and expanding of attribute filters', function ()
    {
        page.search().then(function ()
        {
            expect(page.isFilterExpanded(0)).toBeTruthy();
            expect(page.isFilterExpanded(1)).toBeTruthy();
        }).then(function ()
        {
            return page.toggleAttributeFilter(0);
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 3);
            expect(page.isFilterExpanded(0)).toBeFalsy();
            expect(page.isFilterExpanded(1)).toBeTruthy();
        }).then(function ()
        {
            return page.toggleAttributeFilter(1);
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 3);
            expect(page.isFilterExpanded(0)).toBeFalsy();
            expect(page.isFilterExpanded(1)).toBeFalsy();
        }).then(function ()
        {
            return page.toggleAttributeFilter(1);
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 3);
            expect(page.isFilterExpanded(0)).toBeFalsy();
            expect(page.isFilterExpanded(1)).toBeTruthy();
        }).then(function ()
        {
            return page.toggleAttributeFilter(0);
        }).then(function ()
        {
            browser.sleep(util.minimumSleepInterval * 3);
            expect(page.isFilterExpanded(0)).toBeTruthy();
            expect(page.isFilterExpanded(1)).toBeTruthy();
        });
    });
    
    

    it('should present result list in pages and allow users to switch pages', function ()
    {
        var totalPages = undefined;
        var firstResult = undefined;
        var secondResult = undefined;
        page.search().then(function ()
        {
            //We should start on page 1
            expect(page.getCurrentPageNumber()).toEqual(1);
        }).then(page.getResultCount)
        .then(function (count)
        {
            totalPages = Math.trunc(count / 25) + 1
            expect(page.getTotalPageCount()).toEqual(totalPages);
            return page.getTitle(0);
        }).then(function (title)
        {
            firstResult = title;
        }).then(function ()
        {
            return page.goToPage(2);
        }).then(function ()
        {
            //Should be on page 2 now
            expect(page.getCurrentPageNumber()).toEqual(2);
            return page.getTitle(0);
        }).then(function (title)
        {
            //The first result should not be the same since we are on a new page
            secondResult = title;
            expect(title).not.toEqual(firstResult);
            return page.goToPage(1);
        }).then(function ()
        {
            return page.getTitle(0);
        }).then(function (title)
        {
            //The first result should be what it was as we went back to page 1
            expect(title).toEqual(firstResult);
            return page.goToNextPage();
        }).then(function ()
        {
            return page.getTitle(0);
        }).then(function (title)
        {
            //Using the next page button, we should be on the second page
            expect(title).toEqual(secondResult);
            expect(page.getCurrentPageNumber()).toEqual(2);
            return page.goToPreviousPage();
        }).then(function ()
        {
            return page.getTitle(0);
        }).then(function (title)
        {
            //Then using the previous button, we should be on the first page
            expect(title).toEqual(firstResult);
            expect(page.getCurrentPageNumber()).toEqual(1);
        });
    });
    
    //Basic page testing like checking page count / expansion of page switching options left
    //out as they are the same in the grid and the list.
    it('should present grid of images in pages and allow users to switch pages', function ()
    {
        var firstResult = undefined;
        page.search()
        .then(page.switchToGridView)
        .then(function ()
        {
            expect(page.getCurrentPageNumber()).toEqual(1);
            return page.getGridImageSrc(0);
        }).then(function (src)
        {
            firstResult = src;
            return page.goToPage(2);
        }).then(function ()
        {
            expect(page.getCurrentPageNumber()).toEqual(2);
            return page.getGridImageSrc(0);
        }).then(function (src)
        {
            expect(src).not.toEqual(firstResult);
            return page.goToPage(1);
        }).then(function ()
        {
            return page.getGridImageSrc(0);
        }).then(function (src)
        {
            expect(src).toEqual(firstResult);
        });
    });
    
    //This test is dependent on at least 626 results (25 * 25 + 1) so it can be disabled on smaller data sets
    it('should adjust the pages available to switch to based on the displayed page', function ()
    {
        page.search()
        .then(page.getFirstSwitchablePage)
        .then(function (first)
        {
            //Originally, the first switchable page is 1
            expect(first).toEqual('1');
        }).then(page.getLastSwitchablePage)
        .then(function (last)
        {
            //Originally, the last switchable page is 25
            expect(last).toEqual('25');
        }).then(function ()
        {
            //Since 13 is the midpoint of 1 and 25, going to 14 should change the page switch options
            return page.goToPage(14);
        }).then(page.getFirstSwitchablePage)
        .then(function (first)
        {
            //Now the first page should be 2
            expect(first).toEqual('2');
        }).then(page.getLastSwitchablePage)
        .then(function (last)
        {
            //Now the last page should be 26
            expect(last).toEqual('26');
        });
    })

    // Helper functions

    function expectTrue (bool)
    {
        expect(bool).toBeTruthy();
    }

    function expectFalse (bool)
    {
        expect(bool).toBeFalsy();
    }

    //Will continuously show more types under the specified attribute until the show more button
    //is disabled (all types are shown) or until it reaches 10/reductionDivisor + 2. This was added
    //since the test data set has an extremely long list of types under some attributes.
    function expandUntilFullyExpanded(attributeNumber, callCount)
    {
        if(callCount > Math.floor((10 / util.reductionDivisor) + 1))
            return;
        var typeCount = undefined, resultCount = undefined;
        page.getResultCount()
        .then(function (count)
        {
            resultCount = count;
        }).then(function ()
        {
            return page.getTypeCountOfAttributeFilter(attributeNumber)
        }).then(function (count)
        {
            typeCount = count;
        }).then(function ()
        {
            return page.isShowMoreTypesButtonEnabled(attributeNumber);
        }).then(function (enabled)
        {
            if(enabled)
            {
                return page.showMoreTypesUnderAttributeFilter(attributeNumber)
                .then(function ()
                {
                    browser.sleep(util.minimumSleepInterval * 2);
                    page.getTypeCountOfAttributeFilter(attributeNumber)
                    .then(function (count)
                    {
                        expect(count).toBeGreaterThan(typeCount);
                        return page.toggleFilterByAttribute(attributeNumber, typeCount);
                    }).then(page.getResultCount)
                    .then(function (count)
                    {
                        browser.sleep(util.minimumSleepInterval * 2);
                        expect(count).toBeLessThan(resultCount);
                        return page.toggleFilterByAttribute(attributeNumber, typeCount);
                    }).then(function ()
                    {
                        expandUntilFullyExpanded(attributeNumber, callCount + 1);
                    });
                })
            }
            else
            {
                return;
            }
        });
    };

    //Does the opposite of the above function.
    function collapseUntilFullyCollapsed(attributeNumber, callCount)
    {
        var typeCount = undefined, resultCount = undefined;
        page.getResultCount()
        .then(function (count)
        {
            resultCount = count;
        }).then(function ()
        {
            return page.getTypeCountOfAttributeFilter(attributeNumber)
        }).then(function (count)
        {
            typeCount = count;
        }).then(function ()
        {
            return page.isShowFewerTypesButtonEnabled(attributeNumber);
        }).then(function (enabled)
        {
            if(enabled)
            {
                return page.showFewerTypesUnderAttributeFilter(attributeNumber)
                .then(function ()
                {
                    browser.sleep(util.minimumSleepInterval * 2);
                    page.getTypeCountOfAttributeFilter(attributeNumber)
                    .then(function (count)
                    {
                        expect(count).toBeLessThan(typeCount);
                        collapseUntilFullyCollapsed(attributeNumber, callCount + 1);  
                    });
                })
            }
            else
            {
                return;
            }
        });
    };

});
