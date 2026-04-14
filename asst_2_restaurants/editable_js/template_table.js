import SortableTable from './sortable_table.js';
/**
 * TABLE VIEW
 * Display data in sortable rows - good for scanning specific information
 */
function showTable(data) {
  // Requirements:
  // - Show data in a table format
  // - Include all important fields
  // - Make it easy to scan and compare
  // - Consider adding sorting functionality
  //   https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/

    /*
        javascript goes here! you can return it below
    */ 
//    const complianceFields = [
//         'food_from_approved_source',
//         'food_protected_from',
//         'ill_workers_restricted',
//         'proper_hand_washing',
//         'cooling_time_and_temperature',
//         'cold_holding_temperature',
//         'hot_holding_temperature',
//         'cooking_time_and_temperature',
//         'reheating_time_and_temperature',
//         'hot_and_cold_running_water',
//         'proper_sewage_disposal',
//         'no_bare_hand_contact',
//         'adequate_hand_washing',
//         'rodent_and_insects',
//         'food_contact_surfaces_and'
//     ];
   
   let rows = '';

   data.forEach(feature => {
        const p = feature.properties;

        const rawDate = p.inspection_date;
        let formattedDate = '-';

        if (rawDate && rawDate !== '------') {
            const dateObj = new Date(rawDate);
        
            const year  = dateObj.getUTCFullYear();
            const month = dateObj.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
            const day   = dateObj.getUTCDate();

            formattedDate = `${year} ${month} ${day}`;  
        }


    rows += `
        <tr>
            <td>${p.name        ?? '-'}</td>
            <td>${p.city        ?? '-'}</td>
            <td>${p.address_line_1        ?? '-'}</td>
            <td>${p.inspection_results       ?? '-'}</td>
            <td>${p.inspection_type       ?? '-'}</td>
            <td>${formattedDate}</td>
        </tr>
    `;
});

setTimeout(() => {
    var sortableTables = document.querySelectorAll('table.sortable')
    for (var i = 0; i < sortableTables.length; i++) {
        new SortableTable(sortableTables[i]);
    }

}, 0);


  /*html*/ 
return `
    <h2 class="view-title">Should You Eat Here?</h2>
    <p>Learn which Maryland restaurants have passed their inspections:</p>
    <br>
    <div class="table-wrapper">
        <table class="sortable restaurant-table">
            <thead>
                <tr>
                    <th aria-sort="none"><button>Name</button></th>
                    <th aria-sort="none"><button>City</button></th>
                    <th>Address</th>
                    <th aria-sort="none"><button>Inspection Results</button></th>
                    <th aria-sort="none"><button>Inspection Type</button></th>
                    <th aria-sort="none"><button>Inspection Date</button></th>
                </tr>
            </thead>
            <tbody>
               ${rows}
            </tbody>
        </table>
    </div>
    <br>
    <p>Some of the categories compliance tests for in the field are: ill workers restricted, proper hand washing, cooling time and temperature...</p>
`;
}

export default showTable;