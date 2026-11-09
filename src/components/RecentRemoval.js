// Update only this shelf so deleting history never reloads Home or its focus.
export function removeRecentTile(button,document){
 const item=button.closest('.recent-item'),section=item?.closest('.media-section');
 if(!item||!section)return;
 const row=section.querySelector('.media-row');
 const items=[...row.querySelectorAll('.recent-item')],index=items.indexOf(item);
 const neighbor=items[index+1]||items[index-1];
 item.remove();
 if(neighbor){neighbor.querySelector('[data-focus]')?.focus({preventScroll:true});return;}
 const empty=document.createElement('p');empty.className='shelf-note subtle';
 empty.textContent='Nothing in Continue Watching.';empty.tabIndex=0;
 empty.setAttribute('data-focus','recent-empty');
 row.replaceChildren(empty);empty.focus({preventScroll:true});
}
